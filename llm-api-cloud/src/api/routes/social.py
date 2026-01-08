from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.application.services.facebook_service import FacebookService

router = APIRouter(tags=["Social"])

class SocialPostRequest(BaseModel):
    text: str
    image_url: str = None
    platform: str = "facebook" 

@router.post("/social/post", summary="Post to Social Media")
async def post_to_social(request: SocialPostRequest):
    """
    Posts a status update to the specified platform (default: facebook).
    """
    if request.platform == "facebook":
        result = FacebookService.post_update(request.text, request.image_url)
    else:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result)
        
    return result
