from src.application.services.image_service import ImageService
from src.infrastructure.config.settings import settings
import uuid

def upload_placeholder():
    file_path = "/Users/sergiomartin/Desktop/FINANCIAL/AlphaSeeker/alphaseeker-web/packages/front/src/assets/news_placeholder.png"
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        
        filename = "static/news_placeholder_stable.png"
        url = ImageService.upload_to_gcs(content, filename)
        print(f"✅ Placeholder uploaded: {url}")
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    upload_placeholder()
