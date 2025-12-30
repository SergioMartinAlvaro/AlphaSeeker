import requests
import json
import logging
import time
from typing import Dict, Any
from src.infrastructure.config.settings import settings
from src.infrastructure.logging.logger import setup_logger

logger = setup_logger(__name__)

class OllamaService:
    @classmethod
    def call_ollama(cls, prompt: str) -> Dict[str, Any]:
        """
        Calls local OLLAMA instance.
        """
        url = settings.OLLAMA_URL
        payload = {
            "model": "llama3", # Or whatever model the user has pulled
            "prompt": f"{prompt}\n\nIMPORTANT: Return strictly a valid JSON object matching the requested schema. No markdown.",
            "stream": False,
            "format": "json" # Ollama supports native JSON mode
        }

        try:
            logger.info(f"🦙 Calling OLLAMA at {url}")
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            response_text = result.get("response", "")
            
            try:
                # Try simple parse
                return json.loads(response_text)
            except Exception:
                # Fallback clean
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_text)
                
        except Exception as e:
            logger.error(f"❌ OLLAMA Error: {e}")
            return {"error": "Ollama API Error", "detail": str(e)}
