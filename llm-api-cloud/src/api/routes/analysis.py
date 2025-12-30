from fastapi import APIRouter, BackgroundTasks
import uuid
from src.application.dtos.schemas import BatchRequest
from src.application.services.job_service import JobService
from src.application.services.analysis_service import AnalysisService

router = APIRouter(tags=["Analysis"])

@router.post("/analyze-batch", summary="Analyze news batch")
async def analyze_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JobService.create_job(job_id, len(request.noticias))
    
    background_tasks.add_task(
        AnalysisService.process_batch, 
        job_id, 
        request.noticias, 
        request.callback_url
    )
    
    return {
        "status": "processing_started", 
        "job_id": job_id, 
        "message": "Analysis started in background"
    }
