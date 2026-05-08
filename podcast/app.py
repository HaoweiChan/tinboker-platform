"""FastAPI application for Podcast Downloader API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Pull secrets from Google Secret Manager into os.environ before any
# router/service module that calls os.getenv() at import time.
from src.secrets_bootstrap import bootstrap
bootstrap()

from src.routers import episode, podcast  # noqa: E402  — must follow bootstrap()

app = FastAPI(
    title="Podcast Downloader API",
    description="API for managing podcast episode processing",
    version="1.0.0"
)

# Configure CORS to allow all origins (for testing with public URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(episode.router)
app.include_router(podcast.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Podcast Downloader API",
        "version": "1.0.0",
        "endpoints": {
            "rerun_summarize_post": "/api/episodes/rerun-summarize (POST with JSON body: {\"episode_id\": \"<episode_id>\"})",
            "rerun_summarize_get": "/api/episodes/rerun-summarize/{episode_id} (GET)",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    """Global health check endpoint."""
    return {"status": "healthy"}
