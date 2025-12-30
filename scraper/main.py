from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scrapper import NewsScraper

app = FastAPI(title="AlphaSeeker News Scraper")
scraper = NewsScraper()

class ScrapeRequest(BaseModel):
    url: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/scrape")
def scrape_endpoint(request: ScrapeRequest):
    result = scraper.scrape_article(request.url)
    if result.get("status") == "failed":
        # We return the error but maybe not a 500, just the error info
        return result
    if "error" in result:
         raise HTTPException(status_code=403, detail=result["error"])
    return result
