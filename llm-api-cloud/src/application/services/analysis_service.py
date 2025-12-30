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
    @classmethod
    def process_batch(cls, job_id: str, noticias: List[NewsItem], callback_url: str):
        logger.info(f"[AnalysisJob {job_id}] Processing {len(noticias)} items. Provider: {settings.LLM_PROVIDER}")
        JobService.update_job(job_id, {"status": "processing"})
        
        prompts = [item.text for item in noticias if isinstance(item.text, str)]
        valid_results = []
        
        for i, prompt in enumerate(tqdm(prompts, desc=f"AnalysisJob {job_id}", unit="item")):
            try:
                # Rate Limiting (only for Gemini to avoid quotas, fast for local)
                if settings.LLM_PROVIDER == "gemini":
                    time.sleep(10)
                
                if settings.LLM_PROVIDER == "ollama":
                    json_data = OllamaService.call_ollama(prompt)
                else:
                    json_data = GeminiService.call_gemini(prompt)
                
                # Merge Metadata
                original_item = noticias[i]
                if original_item.metadata:
                    if isinstance(json_data, dict):
                         json_data = {**json_data, **original_item.metadata}
                    else:
                         json_data = {"llm_output": json_data, **original_item.metadata}

                # Validation (Reusing GeminiService logic for default values)
                json_data = GeminiService.validate_and_fix_response(json_data)
                valid_results.append(json_data)
                logger.info(f"✅ Item {i+1} processed")
            except Exception as e:
                logger.error(f"❌ Item {i+1} failed: {e}")
                valid_results.append({"error": "Processing Exception", "detail": str(e)})

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
