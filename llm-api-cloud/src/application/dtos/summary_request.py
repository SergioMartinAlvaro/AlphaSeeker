from pydantic import BaseModel
from typing import List, Dict, Any

class SummaryRequest(BaseModel):
    items: List[Dict[str, Any]]
