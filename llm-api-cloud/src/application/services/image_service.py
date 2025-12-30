import time
import requests
import uuid
from typing import List, Dict, Any
from tqdm import tqdm
from google.cloud import storage
from src.infrastructure.config.settings import settings
from src.infrastructure.logging.logger import setup_logger

logger = setup_logger(__name__)

class ImageService:

    @staticmethod
    def upload_to_gcs(image_content: bytes, destination_blob_name: str) -> str:
        try:
            storage_client = storage.Client()
            bucket = storage_client.bucket(settings.BUCKET_NAME)
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_string(image_content, content_type="image/jpeg")
            return f"https://storage.googleapis.com/{settings.BUCKET_NAME}/{destination_blob_name}"
        except Exception as e:
            logger.error(f"Error uploading to GCS: {e}")
            return None

    @staticmethod
    def generate_without_upload(prompt: str) -> bytes:
        try:
            style = "flat vector art, modern corporate memphis style, financial technology aesthetic, minimalist, clean lines, vibrant blue and white colors, high quality"
            full_prompt = f"{prompt}, {style}"
            encoded_prompt = requests.utils.quote(full_prompt)
            seed = int(time.time() * 1000) % 10000
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&seed={seed}"
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Pollinations Error: {e}")
            return None

    @classmethod
    def process_batch(cls, job_id: str, items: List[Dict[str, Any]], callback_url: str):
        start_time = time.time()
        TIMEOUT_SECONDS = 180 # 3 minutes
        
        logger.info(f"🚀 [ImageJob {job_id}] STARTING. Items: {len(items)}. Timeout: {TIMEOUT_SECONDS}s")
        results = []
        
        for i, item in enumerate(tqdm(items, desc=f"ImageJob {job_id}", unit="img")):
            # Check Timeout
            elapsed = time.time() - start_time
            if elapsed > TIMEOUT_SECONDS:
                logger.warning(f"⚠️ [ImageJob {job_id}] TIMEOUT EXCEEDED ({elapsed:.1f}s). Stopping batch.")
                break
                
            item_data = item.copy()
            prompt = item_data.get('image_prompt') or f"financial concept {item_data.get('title', '')}"
            image_url = ""
            
            if prompt:
                if not settings.ENABLE_IMAGE_GEN:
                    logger.info(f"🚫 [ImageJob {job_id}] Image Gen DISABLED. Skipping '{prompt[:15]}...'")
                    image_url = "https://via.placeholder.com/800x600.png?text=Image+Gen+Disabled"
                else:
                    logger.info(f"🎨 [ImageJob {job_id}] Generating item {i+1}/{len(items)}: '{prompt[:30]}...'")
                
                # Rate limit
                time.sleep(2) 
                
                img_bytes = cls.generate_without_upload(prompt)
                if img_bytes:
                    filename = f"news-images/{job_id}_{uuid.uuid4()}.jpg"
                    image_url = cls.upload_to_gcs(img_bytes, filename) or ""
                    if image_url:
                        logger.info(f"✅ [ImageJob {job_id}] Uploaded: {image_url}")
                    else:
                        logger.error(f"❌ [ImageJob {job_id}] Upload Failed")
                else:
                    logger.error(f"❌ [ImageJob {job_id}] Generation Failed")
            
            item_data['generated_image_url'] = image_url
            results.append(item_data)
        
        total_time = time.time() - start_time
        logger.info(f"🏁 [ImageJob {job_id}] COMPLETED in {total_time:.2f}s. Sent {len(results)} items.")

        try:
            requests.post(callback_url, json={"job_id": job_id, "status": "completed", "results": results}, timeout=10)
            logger.info(f"📞 [ImageJob {job_id}] Callback sent successfully.")
        except Exception as e:
            logger.error(f"❌ [ImageJob {job_id}] Callback error: {e}")
