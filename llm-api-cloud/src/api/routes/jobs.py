from fastapi import APIRouter, HTTPException
from src.application.services.job_service import JobService

router = APIRouter(tags=["Jobs"])

@router.get("/job/{job_id}", summary="Get Job Status")
async def get_job_status(job_id: str):
    job = JobService.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "job_id": job_id,
        "status": job["status"]
    }
    
    if job["status"] == "completed":
        response["results"] = job["results"]
    elif job["status"] == "failed":
        response["error"] = job.get("error")
        
    return response
