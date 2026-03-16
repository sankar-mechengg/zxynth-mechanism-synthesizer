"""
Job Manager — handles job lifecycle with Redis as state store.

Job state is stored in Redis as hash keys:
  job:{job_id}:status   → JobStatus enum value
  job:{job_id}:progress → JSON {generation, bestFitness}
  job:{job_id}:result   → JSON FullSynthesisResult
  job:{job_id}:error    → error message string
"""

import json
import uuid
from typing import Optional, Dict, Any

import redis

from ..config import settings
from ..models.enums import JobStatus


# Redis connection pool
_redis_pool = None


def get_redis() -> redis.Redis:
    """Get or create Redis connection."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


def create_job() -> str:
    """Create a new job and return its ID."""
    job_id = str(uuid.uuid4())[:12]
    r = get_redis()
    r.hset(f"job:{job_id}", mapping={
        "status": JobStatus.QUEUED.value,
        "generation": "0",
        "bestFitness": "",
        "error": "",
    })
    # Set TTL: auto-expire after 2 hours
    r.expire(f"job:{job_id}", 7200)
    return job_id


def update_job_status(job_id: str, status: JobStatus):
    """Update job status."""
    r = get_redis()
    r.hset(f"job:{job_id}", "status", status.value)


def update_job_progress(job_id: str, generation: int, best_fitness: Optional[float] = None):
    """Update optimization progress."""
    r = get_redis()
    updates = {"generation": str(generation), "status": JobStatus.RUNNING.value}
    if best_fitness is not None:
        updates["bestFitness"] = str(best_fitness)
    r.hset(f"job:{job_id}", mapping=updates)


def set_job_result(job_id: str, result: Dict[str, Any]):
    """Store completed job result."""
    r = get_redis()
    r.hset(f"job:{job_id}", mapping={
        "status": JobStatus.COMPLETE.value,
        "result": json.dumps(result),
    })


def set_job_error(job_id: str, error: str):
    """Mark job as failed with error message."""
    r = get_redis()
    r.hset(f"job:{job_id}", mapping={
        "status": JobStatus.FAILED.value,
        "error": error,
    })


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get current job status and progress."""
    r = get_redis()
    data = r.hgetall(f"job:{job_id}")
    if not data:
        return None

    result = {
        "jobId": job_id,
        "status": data.get("status", JobStatus.QUEUED.value),
        "generation": int(data.get("generation", 0)),
        "bestFitness": None,
        "error": data.get("error", "") or None,
    }

    bf = data.get("bestFitness", "")
    if bf:
        try:
            result["bestFitness"] = float(bf)
        except ValueError:
            pass

    return result


def get_job_result(job_id: str) -> Optional[Dict[str, Any]]:
    """Get completed job result."""
    r = get_redis()
    data = r.hgetall(f"job:{job_id}")
    if not data:
        return None

    status = data.get("status")
    if status != JobStatus.COMPLETE.value:
        return None

    result_str = data.get("result", "")
    if not result_str:
        return None

    try:
        return json.loads(result_str)
    except json.JSONDecodeError:
        return None


def get_queue_info() -> Dict[str, Any]:
    """Get queue statistics."""
    r = get_redis()
    try:
        info = r.info("clients")
        keys = r.keys("job:*")
        # Count by status
        statuses = {}
        for key in keys[:100]:  # Limit scan
            s = r.hget(key, "status")
            if s:
                statuses[s] = statuses.get(s, 0) + 1

        return {
            "connected_clients": info.get("connected_clients", 0),
            "total_jobs": len(keys),
            "by_status": statuses,
        }
    except Exception as e:
        return {"error": str(e)}
