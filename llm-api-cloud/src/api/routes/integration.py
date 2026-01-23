from fastapi import APIRouter, HTTPException, Depends
from src.application.services.token_manager import TokenManager
from src.api.dependencies.auth import get_api_key

router = APIRouter(prefix="/integration", tags=["Integration"], dependencies=[Depends(get_api_key)])

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
