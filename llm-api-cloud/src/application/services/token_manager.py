import requests
import datetime
from src.infrastructure.config.settings import settings
from src.infrastructure.config.firebase_config import FirebaseConfig

class TokenManager:
    COLLECTION_NAME = "config"
    DOC_ID = "facebook_token"

    @classmethod
    def get_valid_token(cls) -> str:
        """
        Retrieves a valid token from Firestore. 
        If expired or missing, attempts to refresh/initialize it using env vars or existing logic.
        """
        db = FirebaseConfig.get_db()
        doc_ref = db.collection(cls.COLLECTION_NAME).document(cls.DOC_ID)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            token = data.get("access_token")
            expires_at = data.get("expires_at") # Timestamp

            # Check if expired (with buffer of 2 days)
            if token and expires_at:
                expiry_dt = expires_at.replace(tzinfo=None) if hasattr(expires_at, 'replace') else expires_at
                if expiry_dt > datetime.datetime.now() + datetime.timedelta(days=2):
                    return token
                else:
                    print(f"Token expiring soon (at {expiry_dt}). Refreshing...")
            
            # If we are here, token exists but is invalid/expired -> Refresh
            # For now, if we have a refresh flow we use it. 
            # If not, and we have env var, we try to exchange env var again effectively resetting it.
            return cls.refresh_token(current_token=token)

        else:
             # First run: Use Env Var
             initial_token = settings.FB_PAGE_ACCESS_TOKEN
             if initial_token:
                 return cls.refresh_token(current_token=initial_token)
             return ""

    @classmethod
    def refresh_token(cls, current_token: str) -> str:
        """
        Exchanges the current token for a Long-Lived one (if possible) and saves it.
        """
        print("Attempting to refresh Facebook Token...")
        url = "https://graph.facebook.com/v19.0/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": settings.FB_APP_ID,
            "client_secret": settings.FB_APP_SECRET,
            "fb_exchange_token": current_token
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if "access_token" in data:
                new_token = data["access_token"]
                expires_in = data.get("expires_in", 5184000) # Default 60 days
                expires_at = datetime.datetime.now() + datetime.timedelta(seconds=expires_in)
                
                cls.save_token(new_token, expires_at)
                print("Facebook Token Refreshed & Saved.")
                return new_token
            else:
                print(f"Error refreshing token: {data}")
                # Fallback: return current if we failed, but log it.
                return current_token 
        except Exception as e:
            print(f"Exception refreshing token: {e}")
            return current_token

    @classmethod
    def save_token(cls, token: str, expires_at: datetime.datetime):
        db = FirebaseConfig.get_db()
        db.collection(cls.COLLECTION_NAME).document(cls.DOC_ID).set({
            "access_token": token,
            "expires_at": expires_at,
            "updated_at": datetime.datetime.now()
        }, merge=True)
