from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY_NAME = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    """
    Validates the API Key provided in the header.
    Refers to API_KEY environment variable.
    """
    # Allow development bypass if explicitly set (optional, good for local testing without keys)
    if os.getenv("ALLOW_NO_AUTH", "false").lower() == "true":
        return "dev-bypass"

    expected_key = os.getenv("API_KEY")
    
    if not expected_key:
        # If no key is configured in server, fail secure (or log warning)
        # For this implementation, we fail secure.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Authorization Misconfiguration"
        )

    if api_key_header == expected_key:
        return api_key_header
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials"
    )
