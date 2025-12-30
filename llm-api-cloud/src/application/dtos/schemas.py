from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class InvestmentAdviceDetails(BaseModel):
    rating: str
    reasoning: str

class NewsAnalysis(BaseModel):
    title: str
    summary: str
    market_impact: str
    sentiment: str
    risk_level: str
    action: str
    investment_advice: InvestmentAdviceDetails
    image_prompt: str

class NewsItem(BaseModel):
    text: str 
    metadata: Optional[Dict[str, Any]] = None 

class BatchRequest(BaseModel):
    noticias: List[NewsItem]
    callback_url: str

class ImageBatchRequest(BaseModel):
    items: List[Dict[str, Any]]
    callback_url: str
