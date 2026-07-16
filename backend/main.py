"""AI Panel Studio — FastAPI application entry point."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.config import settings
from backend.api.discussions import router as discussions_router
from backend.api.streaming import router as streaming_router

app = FastAPI(
    title="AI Panel Studio",
    description="AI圆桌讨论 Web App",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(discussions_router)
app.include_router(streaming_router)

# Serve frontend static files — try new React app first, fall back to old
new_frontend = Path(__file__).resolve().parent.parent / "frontend-new" / "dist"
old_frontend = Path(__file__).resolve().parent.parent / "frontend"
if new_frontend.exists():
    app.mount("/", StaticFiles(directory=str(new_frontend), html=True), name="frontend")
elif old_frontend.exists():
    app.mount("/", StaticFiles(directory=str(old_frontend), html=True), name="frontend")


@app.on_event("startup")
async def startup():
    """Initialize the database on app startup."""
    init_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
