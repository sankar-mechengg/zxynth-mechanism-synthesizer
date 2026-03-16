"""
Synthesis API routes.
"""

from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    SynthesisRequest,
    JobSubmitResponse,
    JobStatusResponse,
    JobResultResponse,
    InversionRequest,
    FullSynthesisResult,
)
from ..models.enums import JobStatus
from ..core.job_manager import create_job, get_job_status, get_job_result
from ..core.tasks import run_synthesis

router = APIRouter()


@router.post("/synthesize", response_model=JobSubmitResponse)
async def submit_synthesis(request: SynthesisRequest):
    """
    Submit a mechanism synthesis job.
    Returns a job ID for polling status.
    """
    # Validate input based on problem type
    if request.problemType == "path":
        if not request.desiredPath or len(request.desiredPath) < 2:
            raise HTTPException(400, "Path generation requires at least 2 path points")
    elif request.problemType == "function":
        if not request.functionData or not request.functionData.pairs or len(request.functionData.pairs) < 2:
            raise HTTPException(400, "Function generation requires at least 2 (θ_in, θ_out) pairs")
    elif request.problemType == "motion":
        if not request.poses or len(request.poses) < 2:
            raise HTTPException(400, "Motion generation requires at least 2 precision poses")

    # Create job in Redis
    job_id = create_job()

    # Build request dict — ensure mechanismType is explicitly included (critical for 6-bar)
    req_dict = request.model_dump()
    req_dict["mechanismType"] = getattr(
        request.mechanismType, "value", str(request.mechanismType)
    )

    # Dispatch to Celery worker
    run_synthesis.delay(job_id, req_dict)

    return JobSubmitResponse(jobId=job_id, status="queued")


@router.get("/job/{job_id}/status", response_model=JobStatusResponse)
async def get_synthesis_status(job_id: str):
    """Poll the status of a synthesis job."""
    status = get_job_status(job_id)
    if status is None:
        raise HTTPException(404, f"Job {job_id} not found")

    return JobStatusResponse(**status)


@router.get("/job/{job_id}/result")
async def get_synthesis_result(job_id: str):
    """Get the full result of a completed synthesis job."""
    status = get_job_status(job_id)
    if status is None:
        raise HTTPException(404, f"Job {job_id} not found")

    if status["status"] != JobStatus.COMPLETE.value:
        raise HTTPException(
            409,
            f"Job {job_id} is not complete (status: {status['status']})"
        )

    result = get_job_result(job_id)
    if result is None:
        raise HTTPException(500, f"Result data missing for job {job_id}")

    return {"jobId": job_id, "result": result}


@router.post("/inversion")
async def compute_inversion(request: InversionRequest):
    """
    Compute kinematic inversion — fix a different link as ground.
    This is synchronous (fast computation, no Celery needed).
    """
    try:
        from ..kinematics.inversion import compute_inversion as _compute
        result = _compute(
            mechanism_dict=request.mechanism.model_dump(),
            fixed_link_index=request.fixedLinkIndex,
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Inversion computation failed: {str(e)}")
