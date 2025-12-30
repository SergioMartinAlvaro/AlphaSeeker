import json
import logging
import time
import google.generativeai as genai
from typing import Dict, Any, List
from src.infrastructure.config.settings import settings
from src.infrastructure.logging.logger import setup_logger

logger = setup_logger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiService:
    
    @staticmethod
    def _repair_json(malformed_text: str, error_detail: str, original_prompt: str = "") -> Dict:
        try:
            logger.info("Attempting to REPAIR JSON with Gemini...")
            model = genai.GenerativeModel(settings.MODEL_NAME)
            prompt = f"""
            ### TASK:
            You are a JSON Repair Agent.
            1. Fix the MALFORMED JSON below to be valid syntax.
            2. If fields are missing/empty, RE-GENERATE them based on ORIGINAL CONTEXT.
            3. Return ONLY the valid JSON object. No markdown.

            ### ERROR:
            {error_detail}

            ### MALFORMED CONTENT:
            {malformed_text[:4000]} 
            
            ### ORIGINAL CONTEXT:
            {original_prompt[:8000]}
            """
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            
            import re
            match = re.search(r'(\{.*\})', text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            return json.loads(text)
        except Exception as e:
            logger.error(f"JSON Repair Failed: {e}")
            raise e

    @classmethod
    def call_gemini(cls, prompt: str) -> Dict:
        if not settings.GEMINI_API_KEY:
             return {"error": "GEMINI_API_KEY not configured"}

        max_retries = settings.MAX_RETRIES
        retry_delay = settings.RETRY_DELAY
        repair_attempts = 0

        generation_config = {
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json",
        }

        for attempt in range(max_retries):
            try:
                model = genai.GenerativeModel(
                    model_name=settings.MODEL_NAME,
                    generation_config=generation_config,
                )

                full_prompt = f"{prompt}\n\nIMPORTANT: Return strictly a JSON object matching the defined schema."
                
                response = model.generate_content(full_prompt)
                
                try:
                    return json.loads(response.text)
                except Exception as e:
                    import re
                    match = re.search(r'(\{.*\})', response.text, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                    
                    if repair_attempts < settings.MAX_REPAIRS:
                         logger.warning(f"JSON Parse failed. Attempting Repair {repair_attempts+1}")
                         repair_attempts += 1
                         return cls._repair_json(response.text, str(e), prompt)
                    raise ValueError("Failed to parse JSON")

            except Exception as e:
                if "429" in str(e) or "Quota" in str(e):
                    logger.warning(f"Quota Exceeded. Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    continue
                logger.error(f"Gemini Error: {e}")
                return {"error": "Gemini API Error", "detail": str(e)}
        
        return {"error": "Max retries exceeded"}

    @classmethod
    def validate_and_fix_response(cls, json_data: Dict) -> Dict:
        """Injects defaults if keys are missing."""
        if "market_impact" not in json_data or not json_data["market_impact"]:
            json_data["market_impact"] = "Análisis no concluyente."
        
        if "sentiment" not in json_data: json_data["sentiment"] = "NEUTRAL"
        if "action" not in json_data: json_data["action"] = "HOLD"
        
        if "investment_advice" not in json_data:
            json_data["investment_advice"] = {"rating": "Hold", "reasoning": "Insuficiente data."}
            
        return json_data
