import os

class Settings:
    PORT: int = int(os.environ.get("PORT", 8080))
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    MODEL_NAME: str = "gemini-2.0-flash"
    BUCKET_NAME: str = "alphaseeker-assets"
    
    # Retry Logic
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 60
    MAX_REPAIRS: int = 2

    # Local Config
    LLM_PROVIDER: str = os.environ.get("LLM_PROVIDER", "gemini").lower() # gemini | ollama
    OLLAMA_URL: str = os.environ.get("OLLAMA_URL", "http://host.docker.internal:11434/api/generate")
    ENABLE_IMAGE_GEN: bool = os.environ.get("ENABLE_IMAGE_GEN", "True").lower() == "true"
    GRADIO_SPACE: str = os.environ.get("GRADIO_SPACE", "black-forest-labs/FLUX.1-schnell")
    HF_TOKEN: str = os.environ.get("HF_TOKEN", "")

    # Facebook Config
    FB_PAGE_ACCESS_TOKEN: str = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
    FB_PAGE_ID: str = os.environ.get("FB_PAGE_ID", "")
    FB_APP_SECRET: str = os.environ.get("FB_APP_SECRET", "")
    FB_APP_ID: str = os.environ.get("FB_APP_ID", "")

settings = Settings()
