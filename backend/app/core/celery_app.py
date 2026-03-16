"""
Celery application configuration.
Uses Redis as both broker and result backend.
"""

import sys

from celery import Celery
from ..config import settings

# Prefork pool uses Unix multiprocessing; use solo on Windows to avoid PermissionError
worker_pool = "solo" if sys.platform == "win32" else "prefork"

celery_app = Celery(
    "zxynth",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timeouts
    task_soft_time_limit=settings.job_timeout,
    task_time_limit=settings.job_timeout + 30,
    result_expires=3600,  # Results expire after 1 hour

    # Concurrency
    worker_pool=worker_pool,
    worker_concurrency=1 if worker_pool == "solo" else settings.max_concurrency,
    worker_prefetch_multiplier=1,  # One task at a time per worker process

    # Task routing
    task_routes={
        "app.core.tasks.run_synthesis": {"queue": "synthesis"},
        "app.core.tasks.run_export": {"queue": "export"},
    },

    # Default queue
    task_default_queue="synthesis",

    # Acknowledgement after task completes (not before)
    task_acks_late=True,

    # Track task state
    task_track_started=True,

    # Retry policy
    task_reject_on_worker_lost=True,
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.core"])
