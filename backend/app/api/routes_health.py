"""
Health check and monitoring routes.
"""

from fastapi import APIRouter
from ..config import settings
from ..core.job_manager import get_queue_info

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check — returns OK if the API is running."""
    redis_ok = False
    try:
        from ..core.job_manager import get_redis
        r = get_redis()
        r.ping()
        redis_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if redis_ok else "degraded",
        "api": True,
        "redis": redis_ok,
        "environment": settings.environment,
    }


@router.get("/queue/status")
async def queue_status():
    """Get Celery queue statistics."""
    info = get_queue_info()
    return {
        "queue": info,
        "config": {
            "maxConcurrency": settings.max_concurrency,
            "jobTimeout": settings.job_timeout,
            "maxQueueSize": settings.max_queue_size,
        },
    }
