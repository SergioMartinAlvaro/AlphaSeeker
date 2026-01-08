import requests
from src.infrastructure.config.settings import settings

class FacebookService:
    BASE_URL = "https://graph.facebook.com/v19.0"

    @staticmethod
    def post_update(text: str, image_url: str = None):
        """
        Posts a status update (with optional photo) to the Facebook Page.
        """
        if not settings.FB_PAGE_ACCESS_TOKEN or not settings.FB_PAGE_ID:
            print("Facebook Config Missing: Skipping initialization")
            return {"status": "skipped", "reason": "missing_credentials"}

        page_id = settings.FB_PAGE_ID
        access_token = settings.FB_PAGE_ACCESS_TOKEN
        
        # Add basic SEO Hashtags if not present
        if "#" not in text:
            text += "\n\n#Finanzas #Mercados #Noticias #Economia #AlphaSeeker"

        try:
            if image_url:
                # Post Photo
                endpoint = f"{FacebookService.BASE_URL}/{page_id}/photos"
                payload = {
                    "url": image_url,
                    "caption": text,
                    "access_token": access_token
                }
            else:
                # Post Text Only (Feed)
                endpoint = f"{FacebookService.BASE_URL}/{page_id}/feed"
                payload = {
                    "message": text,
                    "access_token": access_token
                }

            response = requests.post(endpoint, data=payload)
            response.raise_for_status()
            
            data = response.json()
            post_id = data.get("id") or data.get("post_id")
            
            return {
                "status": "success", 
                "platform": "facebook",
                "post_id": post_id,
                "url": f"https://facebook.com/{post_id}" 
            }

        except requests.exceptions.RequestException as e:
            error_detail = "Unknown error"
            if e.response is not None:
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = e.response.text
            
            print(f"Error posting to Facebook: {e}")
            print(f"Facebook API Response details: {error_detail}") # CRITICAL: Log this for debugging
            
            return {"status": "error", "error": str(e), "detail": error_detail}
