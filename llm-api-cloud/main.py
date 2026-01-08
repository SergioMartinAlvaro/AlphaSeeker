from fastapi import FastAPI
from src.infrastructure.config.settings import settings
from src.api.routes import analysis, images, jobs, social

app = FastAPI(
    title="AlphaSeeker Cloud LLM API (Clean Arch)",
    version="2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include Routers
app.include_router(analysis.router)
app.include_router(images.router)
app.include_router(jobs.router)
app.include_router(jobs.router)
app.include_router(social.router)
from src.api.routes import integration
app.include_router(integration.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
