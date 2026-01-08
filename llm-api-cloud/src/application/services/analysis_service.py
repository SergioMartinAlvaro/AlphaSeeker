import time
import uuid
import requests
import json
from tqdm import tqdm
from typing import List, Dict, Any
from src.application.dtos.schemas import NewsItem
from src.application.services.ollama_service import OllamaService
from src.infrastructure.config.settings import settings

from src.infrastructure.logging.logger import setup_logger
from src.application.services.gemini_service import GeminiService
from src.application.services.job_service import JobService

logger = setup_logger(__name__)


class AnalysisService:
    SYSTEM_PROMPT = """
    ROLE: You are an expert Financial Analyst (PRO Level).
    TASK: Analyze the following financial news item and provide actionable intelligence.
    
    INSTRUCTIONS:
    1.  **Analyze**: Determine the 'market_impact' (Short-term vs Long-term).
    2.  **Sentiment**: Classify as BULLISH, BEARISH, or NEUTRAL.
    3.  **Action**: Suggest BUY, SELL, or HOLD.
    4.  **Risk**: Assess risk level (LOW, MEDIUM, HIGH).
    5.  **Output**: Return strictly valid JSON.

    REQUIRED JSON STRUCTURE:
    {
      "title": "Translated title in Spanish",
      "summary": "Concise summary in Spanish",
      "market_impact": "Detailed impact analysis in Spanish. MUST NOT BE EMPTY.",
      "sentiment": "BULLISH|BEARISH|NEUTRAL",
      "risk_level": "LOW|MEDIUM|HIGH",
      "action": "BUY|SELL|HOLD",
      "category": "MERCADOS|MACRO|CRIPTO|CORPORATIVO|DIVISAS|REGULACIÓN|OTROS",
      "asset_class": "ACCIONES|CRIPTOMONEDAS|FOREX|MATERIAS PRIMAS|ÍNDICES|RENTA FIJA|MULTIASTET",
      "tags": ["Tag1", "Tag2"],
      "investment_advice": {
        "rating": "Buy/Sell/Hold",
        "reasoning": "Detailed reasoning in Spanish"
      },
      "image_prompt": "A futuristic financial concept art description describing the news topic, high quality, 8k"
    }
    
    IMPORTANT CATEGORIZATION RULES:
    - **category**: Choose the most relevant high-level domain.
    - **asset_class**: Identify the specific type of asset involved.
    - **tags**: Include 2-5 relevant tags (tickers, entities, or concepts).
    - If the news is irrelevant or purely generic, set 'market_impact' to "IRRELEVANT" and action "HOLD".
    - Do NOT return markdown code blocks. Just the JSON object.
    """

    @classmethod
    def process_batch(cls, job_id: str, noticias: List[NewsItem], callback_url: str):
        logger.info(f"[AnalysisJob {job_id}] Processing {len(noticias)} items. Provider: {settings.LLM_PROVIDER}")
        JobService.update_job(job_id, {"status": "processing"})
        
        prompts = [item.text for item in noticias if isinstance(item.text, str)]
        valid_results = []
        
        for i, raw_text in enumerate(tqdm(prompts, desc=f"AnalysisJob {job_id}", unit="item")):
            # Construct Full Prompt with Persona
            full_prompt = f"{cls.SYSTEM_PROMPT}\n\n--- NEWS CONTENT ---\n{raw_text}"
            
            json_data = {}
            MAX_CONTENT_RETRIES = 2
            
            for attempt in range(MAX_CONTENT_RETRIES):
                try:
                    # Rate Limiting (Gemini)
                    if settings.LLM_PROVIDER == "gemini":
                        time.sleep(5) # Reduced to 5s to speed up retries
                    
                    if settings.LLM_PROVIDER == "ollama":
                        json_data = OllamaService.call_ollama(full_prompt)
                    else:
                        json_data = GeminiService.call_gemini(full_prompt)
                    
                    # Semantic Validation: Check if it looks like a real analysis
                    if not isinstance(json_data, dict) or not json_data.get("market_impact") or json_data.get("market_impact") == "Análisis no concluyente.":
                         if attempt < MAX_CONTENT_RETRIES - 1:
                             logger.warning(f"⚠️ Item {i+1}: Analysis inconclusive. Retrying ({attempt+1}/{MAX_CONTENT_RETRIES})...")
                             continue # Retry loop
                    
                    # If we got here, result is likely good or we ran out of retries
                    break
                    
                except Exception as e:
                    logger.error(f"❌ Item {i+1} attempt {attempt+1} failed: {e}")
                    if attempt == MAX_CONTENT_RETRIES - 1:
                        json_data = {"error": "Processing Exception", "detail": str(e)}

            # Final Fallback Validation
            json_data = GeminiService.validate_and_fix_response(json_data)
            
            # --- IMAGE GENERATION & GCS UPLOAD ---
            if settings.ENABLE_IMAGE_GEN:
                from src.application.services.image_service import ImageService
                prompt = json_data.get('image_prompt') or f"financial concept {json_data.get('title', '')}"
                logger.info(f"🎨 Item {i+1}: Generating image for '{prompt[:30]}...'")
                
                # Rate limit for image gen (Pollinations)
                time.sleep(2)
                
                img_bytes = ImageService.generate_without_upload(prompt)
                if img_bytes:
                    filename = f"news-images/{job_id}_{uuid.uuid4()}.jpg"
                    gcs_url = ImageService.upload_to_gcs(img_bytes, filename)
                    if gcs_url:
                        json_data['image_url'] = gcs_url
                        logger.info(f"✅ Item {i+1}: Image uploaded to GCS: {gcs_url}")
                    else:
                        logger.error(f"❌ Item {i+1}: GCS upload failed")
                else:
                    logger.error(f"❌ Item {i+1}: Image generation failed")
            # ---------------------------------------

            # Merge Metadata
            original_item = noticias[i]
            if original_item.metadata:
                # Prioritize existing keys in json_data, fallback to metadata
                # Note: 'image_url' in json_data (GCS) should prevail over metadata if present
                if isinstance(json_data, dict):
                     json_data = {**original_item.metadata, **json_data}
                else:
                     json_data = {"llm_output": json_data, **original_item.metadata}

            valid_results.append(json_data)
            logger.info(f"✅ Item {i+1} processed")

        JobService.set_job_results(job_id, valid_results)
        
        # Callback
        try:
            requests.post(callback_url, json={
                "job_id": job_id, 
                "status": "completed", 
                "results": valid_results
            }, timeout=10)
            logger.info(f"Callback sent for {job_id}")
        except Exception as e:
            logger.error(f"Callback failed for {job_id}: {e}")

    async def generate_market_summary(self, news_items: list) -> dict:
        """
        Synthesizes multiple news items into a single engaging social media post.
        """
        if not news_items:
            return {"social_content": "", "image_prompt": ""}

        # Prepare context
        context_str = ""
        for i, item in enumerate(news_items):
            context_str += f"{i+1}. {item.get('title', 'No Title')} ({item.get('sentiment', 'NEUTRAL')})\n   Summary: {item.get('summary', '')}\n   Advice: {item.get('investment_advice', {}).get('reasoning', '')}\n\n"

        prompt = f"""
        ### Role:
        You are a Senior Financial Analyst and Social Media Influencer for 'AlphaSeeker'.

        ### Task:
        Read the following recent market news and generate a SINGLE, POWERFUL social media post (Facebook/Instagram style) that summarizes the current market mood.

        ### Input News:
        {context_str}

        ### Output Requirements (STRICT JSON):
        1. **social_content**: A single text block.
           - **Head**: 1 catchy line using CAPSLOCK/Emojis (e.g., "🚨 MERCADO EN ALERTA: ¿CRASH O OPORTUNIDAD?").
           - **Body**: Synthesize the key themes. Don't list news 1 by 1. Instead, narrate the story: "Inflation fears are back while Tech stocks rally...". Group related items.
           - **Action**: Give a general advice based on the collective sentiment (e.g., "Moment to accumulate defensive stocks").
           - **Closing**: "👇 ¿Qué opinas? ¡Te leemos!"
           - **Hashtags**: #AlphaSeeker #Finanzas #Inversión + 3 specific tags.
           - **Language**: Spanish. Top-tier professional yet accessible tone.
        
        2. **image_prompt**: A prompt for an AI image generator.
           - Abstract, cinematic concept representing the COLLECTIVE mood.
           - E.g., "A bull fighting a bear on a digital cliff, neon lines, cinematic lighting".
           - No text in image.

        ### JSON Schema:
        {{
            "social_content": "...",
            "image_prompt": "..."
        }}
        """
        
        from fastapi.concurrency import run_in_threadpool
        result = await run_in_threadpool(GeminiService.call_gemini, prompt)
        
        # 3. Generate Image Internally
        if isinstance(result, dict) and result.get("image_prompt"):
             from src.application.services.image_service import ImageService
             # Run image generation in threadpool to avoid blocking
             image_url = await run_in_threadpool(ImageService.generate_and_upload, result["image_prompt"])
             result["image_url"] = image_url
        
        return result
