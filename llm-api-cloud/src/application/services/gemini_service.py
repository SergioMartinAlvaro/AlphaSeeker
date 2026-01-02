import json
import logging
import time
from google import genai
from google.genai import types
from typing import Dict, Any, List
from src.infrastructure.config.settings import settings
from src.infrastructure.logging.logger import setup_logger

logger = setup_logger(__name__)

# Singleton Client
client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

class GeminiService:
    @staticmethod
    def _get_client():
        global client
        if not client and settings.GEMINI_API_KEY:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return client

    @staticmethod
    def _repair_json(malformed_text: str, error_detail: str, original_prompt: str = "") -> Dict:
        try:
            logger.info("Attempting to REPAIR JSON with Gemini...")
            gen_client = GeminiService._get_client()
            if not gen_client:
                raise ValueError("Gemini Client not initialized")

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
            response = gen_client.models.generate_content(
                model=settings.MODEL_NAME,
                contents=prompt
            )
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
        gen_client = cls._get_client()
        if not gen_client:
            return {"error": "GEMINI_API_KEY not configured"}

        max_retries = settings.MAX_RETRIES
        retry_delay = settings.RETRY_DELAY
        repair_attempts = 0

        config = types.GenerateContentConfig(
            temperature=0.2,
            top_p=0.95,
            top_k=64,
            max_output_tokens=8192,
            response_mime_type="application/json",
        )

        for attempt in range(max_retries):
            try:
                full_prompt = f"{prompt}\n\nIMPORTANT: Return strictly a JSON object matching the defined schema."
                
                response = gen_client.models.generate_content(
                    model=settings.MODEL_NAME,
                    contents=full_prompt,
                    config=config
                )
                
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
                # Handling quota or 429 errors in the new SDK
                err_str = str(e)
                if "429" in err_str or "Quota" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    logger.warning(f"Quota Exceeded. Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    continue
                logger.error(f"Gemini Error: {e}")
                return {"error": "Gemini API Error", "detail": err_str}
        
        return {"error": "Max retries exceeded"}

    @classmethod
    def validate_and_fix_response(cls, json_data: Dict) -> Dict:
        """Injects defaults if keys are missing."""
        if not isinstance(json_data, dict):
            json_data = {}
            
        if "market_impact" not in json_data or not json_data["market_impact"]:
            json_data["market_impact"] = "Análisis no concluyente."
        
        if "sentiment" not in json_data: json_data["sentiment"] = "NEUTRAL"
        if "action" not in json_data: json_data["action"] = "HOLD"
        
        if "investment_advice" not in json_data:
            json_data["investment_advice"] = {"rating": "Hold", "reasoning": "Insuficiente data."}
            
        return json_data
