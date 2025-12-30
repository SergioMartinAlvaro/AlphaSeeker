from typing import Dict, Any, Optional

class JobService:
    _jobs: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def create_job(cls, job_id: str, total_items: int) -> Dict[str, Any]:
        cls._jobs[job_id] = {
            "status": "pending",
            "created_at": None, # Should be set by caller or here
            "total_items": total_items,
            "results": []
        }
        return cls._jobs[job_id]

    @classmethod
    def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        return cls._jobs.get(job_id)

    @classmethod
    def update_job(cls, job_id: str, updates: Dict[str, Any]):
        if job_id in cls._jobs:
            cls._jobs[job_id].update(updates)

    @classmethod
    def set_job_results(cls, job_id: str, results: list):
        if job_id in cls._jobs:
            cls._jobs[job_id]["results"] = results
            cls._jobs[job_id]["status"] = "completed"

    @classmethod
    def fail_job(cls, job_id: str, error: str):
        if job_id in cls._jobs:
            cls._jobs[job_id]["status"] = "failed"
            cls._jobs[job_id]["error"] = error
