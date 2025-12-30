import os
import json
import uuid
import logging
import requests
import uvicorn
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from logging.handlers import RotatingFileHandler

# --- Configuración de Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuración del Entorno ---
API_PORT = int(os.environ.get("PORT", 8080))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("ADVERTENCIA: GEMINI_API_KEY no está definida. La API fallará si se intenta usar.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        logger.info("--- MODELOS DISPONIBLES ---")
        for m in genai.list_models():
             if 'generateContent' in m.supported_generation_methods:
                logger.info(f"Modelo: {m.name}")
        logger.info("---------------------------")
    except Exception as e:
        logger.error(f"Error listando modelos: {e}")

# Esquema de Respuesta Estricto para Gemini
# Esquema de Respuesta Estricto para Gemini
class InvestmentAdviceDetails(BaseModel):
    rating: str
    reasoning: str

class NewsAnalysis(BaseModel):
    title: str
    summary: str
    market_impact: str # Campo OBLIGATORIO
    sentiment: str
    risk_level: str
    action: str
    investment_advice: InvestmentAdviceDetails
    image_prompt: str

# Configuración del modelo Gemini
GENERATION_CONFIG = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
    "response_schema": NewsAnalysis # ENFORCE SCHEMA
}

# Configuración
# IMPOTANT: gemini-2.0-flash-lite has 0 Quota for Free Tier. 
# Switching to gemini-2.0-flash (Standard Flash) which is in your list.
# MODEL_NAME = "gemini-2.0-flash-lite-001" 
MODEL_NAME = "gemini-2.0-flash"
# Force Re-deploy Timestamp: 2025-12-27 00:55
app = FastAPI(title="AlphaSeeker Cloud LLM API (Gemini)", version="1.0")

# Almacenamiento en memoria para los trabajos (Jobs)
jobs: Dict[str, Dict[str, Any]] = {}

# Esquema para input
class NewsItem(BaseModel):
    text: str 
    metadata: Optional[Dict[str, Any]] = None 

class BatchRequest(BaseModel):
    noticias: List[NewsItem]
    callback_url: str

# --- Funciones de Procesamiento ---

# --- Funciones de Procesamiento ---

def repair_json(malformed_text: str, error_detail: str, original_prompt: str = "") -> Dict:
    """
    Intenta reparar JSON mal formado pidiendo a Gemini que lo corrija.
    CRITICAL UPGRADE: Recibe 'original_prompt' para REGENERAR contenido perdido.
    """
    try:
        logger.info(f"Attempting to REPAIR JSON with Gemini...")
        model = genai.GenerativeModel(MODEL_NAME) # Use same model as main generation
        prompt = f"""
        ### TASK:
        You are a JSON Repair Agent.
        1. Fix the MALFORMED JSON below to be valid syntax.
        2. CRITICAL: If fields like 'market_impact', 'sentiment', or 'action' are MISSING, EMPTY, or NONE, YOU MUST RE-GENERATE THEM based on the ORIGINAL CONTEXT below.
        3. Do NOT return empty fields.
        4. Return ONLY the valid JSON object. No markdown.

        ### ERROR:
        {error_detail}

        ### MALFORMED CONTENT:
        {malformed_text[:4000]} 
        
        ### ORIGINAL CONTEXT (Analyze this to fill missing fields):
        {original_prompt[:8000]}
        """
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        
        # Try finding brace if still noisy
        import re
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
             return json.loads(match.group(1))
        return json.loads(text)
    except Exception as e:
        logger.error(f"JSON Repair Failed: {e}")
        raise e # Re-raise to trigger final fallback

def call_gemini(prompt: str) -> Dict:
    """
    Llama a la API de Google Gemini con Schema Enforcement y Retry.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    max_retries = 3
    retry_delay = 60 # Seconds
    repair_attempts = 0 # Cost Control: Max 2 repairs per item

    for attempt in range(max_retries):
        try:
            model = genai.GenerativeModel(
                model_name=MODEL_NAME,
                generation_config=GENERATION_CONFIG,
            )

            full_prompt = f"{prompt}\n\nIMPORTANT: Return strictly a JSON object matching the defined schema. 'market_impact' must be a detailed analysis string."

            response = model.generate_content(full_prompt)
            
            try:
                return json.loads(response.text)
            except Exception:
                logger.warning(f"Standard parsing failed. Attempting robust Regex extraction.")
                import re
                try:
                    match = re.search(r'(\{.*\})', response.text, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        return json.loads(json_str)
                    else:
                        raise ValueError("No JSON object found in response")
                except Exception as e:
                     # COST CONTROL: Only try repair if we haven't exceeded limit
                     if repair_attempts < 2:
                         logger.error(f"Regex parsing failed: {e}. Attempting SELF-HEALING REPAIR ({repair_attempts+1}/2).")
                         repair_attempts += 1
                         try:
                             return repair_json(response.text, str(e), original_prompt=prompt)
                         except Exception as repair_error:
                             return {"error": "Parsing Error", "detail": f"Failed to parse JSON even after repair. Raw start: {response.text[:250]}..."}
                     else:
                         logger.error(f"Regex parsing failed and MAX REPAIR LIMIT (2) reached. Giving up.")
                         return {"error": "Parsing Error", "detail": "Max repair attempts reached."}
        
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "Quota exceeded" in error_str:
                logger.warning(f"Quota Exceeded (Attempt {attempt+1}/{max_retries}). Retrying in {retry_delay}s...")
                import time
                time.sleep(retry_delay)
                continue # Retry
            else:
                logger.error(f"Error calling Gemini: {e}")
                return {"error": "Gemini API Error", "detail": str(e)[:500]}
    
    return {"error": "Max retries exceeded (Quota)"}

def process_batch_with_callback(job_id: str, noticias: List[NewsItem], callback_url: str):
    """
    Procesa el lote usando Gemini y envía resultados al webhook.
    """
    logger.info(f"[Job {job_id}] Iniciando procesamiento en cloud con Gemini. {len(noticias)} items.")
    jobs[job_id]["status"] = "processing"
    results = []
    
    prompts = [item.text for item in noticias if isinstance(item.text, str)]
    
    if not prompts:
        error_msg = "Lista de prompts vacía o inválida."
        logger.error(f"[Job {job_id}] {error_msg}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = error_msg
        try:
            requests.post(callback_url, json={"job_id": job_id, "status": "failed", "error": error_msg})
        except Exception as e:
            logger.error(f"[Job {job_id}] Error enviando callback de fallo: {e}")
        return

    valid_results = []
    logger.info(f"🚀 [JOB START] {job_id} | Items: {len(prompts)}")
    
    for i, prompt in enumerate(prompts):
        try:
            # Extract title snippet for log readability
            file_title = noticias[i].metadata.get('url', 'Unknown URL') if noticias[i].metadata else prompt[:50].replace('\n', ' ')
            logger.info(f"▶️ [ITEM {i+1}/{len(prompts)}] Procesando: {file_title}...")
            
            # Llamada a Gemini (Rate Limit: sleep 10s para cumplir cuota 10 RPM)
            import time
            time.sleep(10) 
            json_data = call_gemini(prompt)
            # logger.info(f"JSON GEMINI:\n{json.dumps(json_data, ensure_ascii=False)[:200]}...") # Reduced noise

            # Merge metadata if exists
            original_item = noticias[i]
            if original_item.metadata:
                if isinstance(json_data, dict):
                    json_data = {**json_data, **original_item.metadata}
                else:
                    json_data = {"llm_output": json_data, **original_item.metadata}

            # VALIDATION & FALLBACK INJECTION
            # Instead of failing, we FORCE defaults so the user always gets a result.
            
            # 1. Market Impact
            if "market_impact" not in json_data or not json_data["market_impact"]:
                logger.warning(f"⚠️ [ITEM RECOVERY] 'market_impact' missing. Injecting default.")
                json_data["market_impact"] = "Análisis no concluyente: El modelo no detectó un impacto claro o la noticia es puramente informativa."

            # 2. Sentiment
            if "sentiment" not in json_data or not json_data["sentiment"]:
                json_data["sentiment"] = "NEUTRAL"
            
            # 3. Action
            if "action" not in json_data or not json_data["action"]:
                json_data["action"] = "HOLD"

            # 4. Investment Advice
            if "investment_advice" not in json_data:
                json_data["investment_advice"] = {
                    "rating": "Hold",
                    "reasoning": "Insuficiente información para recomendación activa."
                }

            # Final Safety Check (should pass now)
            required_keys = ["market_impact", "sentiment", "action"]
            if not all(key in json_data for key in required_keys):
                 # This should theoretically be unreachable now, but strictly keeping it just in case
                 logger.warning(f"⚠️ [ITEM SKIP] Esquema sigue inválido tras recovery. Faltan: {[k for k in required_keys if k not in json_data]}")
                 json_data["error"] = "Schema Validation Failed"
                 json_data["detail"] = f"Missing keys: {[k for k in required_keys if k not in json_data]}"
                 valid_results.append(json_data)
                 continue

            valid_results.append(json_data)
            logger.info(f"✅ [ITEM SUCCESS] Validado (con posibles defaults).")
            
        except Exception as e:
            logger.error(f"❌ [ITEM ERROR] Excepción inesperada: {e}", exc_info=True)
            valid_results.append({"error": "Processing Exception", "detail": str(e)})

    # Actualizar estado final
    jobs[job_id]["results"] = valid_results
    jobs[job_id]["status"] = "completed"
    logger.info(f"🏁 [JOB END] {job_id} | Procesados: {len(valid_results)}/{len(prompts)} | Callback -> {callback_url}")

    # Enviar Callback
    try:
        payload = {
            "job_id": job_id,
            "status": "completed",
            "results": valid_results
        }
        
        response = requests.post(callback_url, json=payload, timeout=10)
        response.raise_for_status()
        logger.info(f"[Job {job_id}] Callback enviado con éxito. Status: {response.status_code}")
    except Exception as e:
        logger.error(f"[Job {job_id}] Error enviando callback: {e}")


# --- Endpoints ---

@app.post("/analyze-batch")
async def analyze_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    """
    Endpoint ASÍNCRONO con CALLBACK (Versión Cloud).
    """
    job_id = str(uuid.uuid4())
    logger.info(f"Recibida petición /analyze-batch (Cloud). Job ID: {job_id}. Callback: {request.callback_url}")
    
    jobs[job_id] = {
        "status": "pending",
        "created_at": str(uuid.uuid4()),
        "total_items": len(request.noticias),
        "results": []
    }
    
    background_tasks.add_task(process_batch_with_callback, job_id, request.noticias, request.callback_url)
    
    return {"status": "processing_started", "job_id": job_id, "message": "Processing started in Cloud (Gemini). Results will be sent to callback_url."}


@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """
    Consulta el estado y resultados de un trabajo asíncrono.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    response = {
        "job_id": job_id,
        "status": job["status"],
    }
    
    if job["status"] == "completed":
        response["results"] = job["results"]
    elif job["status"] == "failed":
        response["error"] = job.get("error")
        
    return response

# --- Ejecutar el Servidor ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)
