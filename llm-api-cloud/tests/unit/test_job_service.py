from src.application.services.job_service import JobService

def test_create_and_get_job():
    job_id = "test_123"
    JobService.create_job(job_id, 10)
    
    job = JobService.get_job(job_id)
    assert job is not None
    assert job["status"] == "pending"
    assert job["total_items"] == 10

def test_update_job():
    job_id = "test_456"
    JobService.create_job(job_id, 1)
    JobService.update_job(job_id, {"status": "processing"})
    
    job = JobService.get_job(job_id)
    assert job["status"] == "processing"
