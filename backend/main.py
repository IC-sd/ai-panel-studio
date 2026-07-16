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
from backend.api.config import router as config_router

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
app.include_router(config_router)

# Serve frontend static files — try new React app first, fall back to old
new_frontend = Path(__file__).resolve().parent.parent / "frontend-new" / "dist"
old_frontend = Path(__file__).resolve().parent.parent / "frontend"
frontend_dir = None
if new_frontend.exists():
    frontend_dir = new_frontend
elif old_frontend.exists():
    frontend_dir = old_frontend

if frontend_dir:
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


# Catch-all SPA fallback: serve index.html for unmatched routes
from starlette.responses import FileResponse


@app.exception_handler(404)
async def spa_fallback(request, exc):
    if request.url.path.startswith("/api/"):
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    if frontend_dir:
        return FileResponse(str(frontend_dir / "index.html"))
    return JSONResponse({"detail": "Not Found"}, status_code=404)


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
