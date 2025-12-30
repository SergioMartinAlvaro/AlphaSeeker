import mlx.core as mx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import json
from mlx_lm import load, generate
import uvicorn
import os
import logging
from logging.handlers import RotatingFileHandler
import uuid
from typing import Dict, Any, List, Optional
import requests
from threading import Lock

# --- Configuración de Logging ---
# Configurar logger para escribir en archivo y consola
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file = 'llm_api.log'

# Handler de archivo (rota cada 5MB, guarda 3 backups)
file_handler = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=3)
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

# Handler de consola
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO)

# Logger raíz
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# --- Configuración del Entorno ---
# Ruta relativa al script
MODEL_PATH = "./AlphaSeeker-8B-v1" 
API_PORT = 8000 

# Global lock for MLX generation to prevent concurrency issues
model_lock = Lock()

# 1. Cargar el modelo globalmente (se ejecuta una sola vez al inicio)
try:
    logger.info(f"Cargando modelo MLX desde: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        logger.error(f"ERROR: No se encuentra el modelo en {MODEL_PATH}")
        exit(1)
        
    model, tokenizer = load(MODEL_PATH)
    logger.info("Modelo cargado con éxito. Listo para servir peticiones.")
except Exception as e:
    logger.critical(f"Error al cargar el modelo: {e}", exc_info=True)
    exit(1)

app = FastAPI(title="AlphaSeeker LLM API", version="1.0")

# Almacenamiento en memoria para los trabajos (Jobs)
# En producción, esto debería ser una base de datos (Redis, Postgres, etc.)
jobs: Dict[str, Dict[str, Any]] = {}

# Esquema Pydantic para validar el cuerpo de la petición
class NewsItem(BaseModel):
    # La API espera que n8n mapee el campo 'prompt_para_api' a 'text'
    text: str 

class BatchRequest(BaseModel):
    noticias: List[NewsItem]
    callback_url: str

# --- Funciones de Procesamiento ---

def safe_json_extract(text: str):
    """
    Limpia la respuesta del modelo, elimina el ruido y extrae el JSON.
    """
    # 1. Buscar la etiqueta de inicio del JSON
    start_tag = "### JSON Esperado:"
    start_index = text.find(start_tag)
    
    if start_index != -1:
        json_text = text[start_index + len(start_tag):].strip()
    else:
        json_text = text.strip()

    # 2. Limpieza de artefactos de fin de texto de LLM
    json_text = json_text.split("<|eot_id|>")[0].strip()
    
    # 3. Asegurar que tiene la forma básica de un objeto JSON
    if json_text.startswith('{') and json_text.endswith('}'):
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.warning(f"JSONDecodeError: {e}. Raw text: {json_text[:100]}...")
            # Devuelve un resultado de error legible si el JSON está mal formado
            return {"error": "JSONDecodeError", "raw_output": json_text[:100] + "...", "relevance_score": 0}

    # 4. Si el output no tiene forma JSON, devolver un error
    logger.warning(f"Output no válido como JSON. Raw text: {json_text[:100]}...")
    return {"error": "Output is not valid JSON format", "raw_output": json_text[:100] + "...", "relevance_score": 0}

def process_batch_with_callback(job_id: str, noticias: List[NewsItem], callback_url: str):
    """
    Función que se ejecuta en segundo plano para procesar el lote y enviar los resultados al webhook.
    """
    logger.info(f"[Job {job_id}] Iniciando procesamiento en segundo plano de {len(noticias)} noticias.")
    
    jobs[job_id]["status"] = "processing"
    results = []
    
    prompts = [item.text for item in noticias if isinstance(item.text, str)]
    
    if not prompts:
        error_msg = "Lista de prompts vacía o inválida."
        logger.error(f"[Job {job_id}] {error_msg}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = error_msg
        # Intentar enviar error al callback
        try:
            requests.post(callback_url, json={"job_id": job_id, "status": "failed", "error": error_msg})
        except Exception as e:
            logger.error(f"[Job {job_id}] Error enviando callback de fallo: {e}")
        return

    for i, prompt in enumerate(prompts):
        try:
            logger.info(f"[Job {job_id}] Procesando noticia {i+1}/{len(prompts)}")
            logger.info(f"PROMPT ENTRADA:\n{prompt[:500]}...") 

            # Generación MLX con Lock para evitar concurrencia en GPU
            with model_lock:
                response_texts = generate(
                    model,
                    tokenizer,
                    prompt=prompt,
                    max_tokens=400, 
                    verbose=False,
                )
            
            raw_output = response_texts 
            logger.info(f"SALIDA RAW LLM:\n{raw_output}") 

            json_data = safe_json_extract(raw_output)
            logger.info(f"JSON PARSEADO:\n{json.dumps(json_data, ensure_ascii=False)}")

            results.append(json_data)
            
        except Exception as e:
            logger.error(f"[Job {job_id}] Error en item {i}: {e}", exc_info=True)
            results.append({"error": "Error durante la generación", "detail": str(e)})
            continue

    # Actualizar estado final
    jobs[job_id]["results"] = results
    jobs[job_id]["status"] = "completed"
    logger.info(f"[Job {job_id}] Procesamiento completado. Enviando resultados a {callback_url}")

    # Enviar Callback
    try:
        payload = {
            "job_id": job_id,
            "status": "completed",
            "results": results
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
    Endpoint ASÍNCRONO con CALLBACK.
    Recibe el lote y una URL de callback.
    Devuelve inmediatamente un 200 OK.
    Procesa en background y envía resultados a la URL.
    """
    job_id = str(uuid.uuid4())
    logger.info(f"Recibida petición /analyze-batch. Job ID: {job_id}. Callback: {request.callback_url}")
    
    # Inicializar estado del job
    jobs[job_id] = {
        "status": "pending",
        "created_at": str(uuid.uuid4()),
        "total_items": len(request.noticias),
        "results": []
    }
    
    # Lanzar tarea en background
    background_tasks.add_task(process_batch_with_callback, job_id, request.noticias, request.callback_url)
    
    return {"status": "processing_started", "job_id": job_id, "message": "Processing started. Results will be sent to callback_url."}


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
    # Servidor escucha en 0.0.0.0 para permitir acceso desde la red local (incluido Docker)
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)