from fastapi import APIRouter, HTTPException
from src.application.services.token_manager import TokenManager

router = APIRouter(prefix="/integration", tags=["Integration"])

@router.get("/facebook/token", summary="Get Valid Facebook Page Token")
async def get_facebook_token():
    """
    Returns a valid, auto-refreshed Facebook Page Access Token.
    Used by n8n to ensure posts never fail due to expired credentials.
    """
    token = TokenManager.get_valid_token()
    if not token:
        raise HTTPException(status_code=500, detail="Could not retrieve a valid Facebook Token")
    
    return {"token": token}
