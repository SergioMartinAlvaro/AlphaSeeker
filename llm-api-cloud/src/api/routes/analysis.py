from fastapi import APIRouter, BackgroundTasks, Depends
import uuid
from src.application.dtos.schemas import BatchRequest
from src.application.services.job_service import JobService
from src.application.services.analysis_service import AnalysisService
from src.api.dependencies.auth import get_api_key

router = APIRouter(prefix="/analysis", tags=["Analysis"], dependencies=[Depends(get_api_key)])

@router.post("/analyze-batch", summary="Analyze news batch")
async def analyze_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JobService.create_job(job_id, len(request.noticias))
    
    background_tasks.add_task(
        AnalysisService.process_batch, 
        job_id, 
        request.noticias, 
        request.callback_url,
        request.webhook_token
    )
    
    return {
        "status": "processing_started", 
        "job_id": job_id, 
        "message": "Analysis started in background"
    }

from src.application.dtos.summary_request import SummaryRequest

@router.post("/summary", summary="Generate Market Summary Post")
async def generate_summary(request: SummaryRequest):
    """
    Generates a single social media post summarising the provided news items.
    """
    service = AnalysisService() # We can instantiate it now or just call the method if I made it static?
    # Actually, I made it an instance method in the class but without 'self' usage it could be static.
    # But wait, looking at my previous edit, I defined it as 'async def generate_market_summary(self, ...)'
    # so it IS an instance method.
    return await service.generate_market_summary(request.items)
