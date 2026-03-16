"""
Zxynth Backend — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .api.routes_synthesis import router as synthesis_router
from .api.routes_export import router as export_router
from .api.routes_parse import router as parse_router
from .api.routes_health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    # Startup: verify Redis connection
    try:
        from .core.celery_app import celery_app
        # Ping Redis through Celery
        insp = celery_app.control.inspect()
        print(f"[Zxynth] Backend started. Environment: {settings.environment}")
        print(f"[Zxynth] Redis: {settings.redis_url}")
    except Exception as e:
        print(f"[Zxynth] Warning: Could not connect to Redis: {e}")
        print("[Zxynth] Synthesis jobs will fail until Redis is available.")

    yield

    # Shutdown
    print("[Zxynth] Backend shutting down.")


app = FastAPI(
    title="Zxynth API",
    description="Planar Mechanism Synthesis Backend — Path, Function, and Motion Generation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers — all under /api prefix
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(synthesis_router, prefix="/api", tags=["Synthesis"])
app.include_router(export_router, prefix="/api", tags=["Export"])
app.include_router(parse_router, prefix="/api", tags=["Parsing"])


@app.get("/")
async def root():
    return {
        "name": "Zxynth API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs" if settings.is_development else "disabled",
    }
