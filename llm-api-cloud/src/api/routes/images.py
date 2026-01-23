from fastapi import APIRouter, BackgroundTasks, Depends
import uuid
from src.application.dtos.schemas import ImageBatchRequest
from src.application.services.job_service import JobService
from src.application.services.image_service import ImageService
from src.api.dependencies.auth import get_api_key

router = APIRouter(prefix="/images", tags=["Images"], dependencies=[Depends(get_api_key)])

@router.post("/generate-images-batch", summary="Generate images batch")
async def generate_images_batch(request: ImageBatchRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    # Note: We don't necessarily track Image jobs in the same JobService unless we want to, 
    # but the schema supports it. For now, we just fire and forget like the original.
    
    background_tasks.add_task(
        ImageService.process_batch, 
        job_id, 
        request.items, 
        request.callback_url
    )
    
    return {
        "status": "processing_started", 
        "job_id": job_id, 
        "message": "Image generation started"
    }

from pydantic import BaseModel

class ImageRequest(BaseModel):
    prompt: str

@router.post("/generate", summary="Generate Single Image")
async def generate_single_image(request: ImageRequest):
    """
    Generates a single image and returns the public GCS URL.
    """
    image_url = ImageService.generate_and_upload(request.prompt)
    if not image_url or "placeholder" in image_url:
         return {"status": "failed", "url": image_url}
    return {"status": "success", "url": image_url}
