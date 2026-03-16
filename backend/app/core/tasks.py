"""
Celery tasks for background synthesis and export jobs.
"""

import time
import traceback
from typing import Dict, Any

from .celery_app import celery_app
from .job_manager import (
    update_job_status,
    update_job_progress,
    set_job_result,
    set_job_error,
)
from ..models.enums import JobStatus


@celery_app.task(name="app.core.tasks.run_synthesis", bind=True, max_retries=0)
def run_synthesis(self, job_id: str, request: Dict[str, Any]):
    """
    Run the full synthesis pipeline as a background task.

    Args:
        job_id: Unique job identifier
        request: SynthesisRequest as dict
    """
    start_time = time.time()

    try:
        update_job_status(job_id, JobStatus.RUNNING)

        # Import pipeline here to avoid circular imports
        from ..synthesis.pipeline import run_synthesis_pipeline

        # Progress callback — called by the optimizer at each generation
        def progress_callback(generation: int, best_fitness: float):
            update_job_progress(job_id, generation, best_fitness)

        # Run the pipeline
        result = run_synthesis_pipeline(request, progress_callback=progress_callback)

        elapsed = time.time() - start_time

        # Add elapsed time to results
        if result.get("optimization"):
            result["optimization"]["elapsed"] = round(elapsed, 2)
        if result.get("analytical"):
            result["analytical"]["elapsed"] = round(elapsed, 2)

        # Store result
        set_job_result(job_id, result)

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        tb = traceback.format_exc()
        print(f"[Zxynth] Synthesis job {job_id} failed:\n{tb}")
        set_job_error(job_id, error_msg)


@celery_app.task(name="app.core.tasks.run_export", bind=True, max_retries=1)
def run_export(self, export_type: str, data: Dict[str, Any], options: Dict[str, Any]):
    """
    Run an export job (PDF, GIF, DXF, SVG).

    Args:
        export_type: 'pdf' | 'gif' | 'dxf' | 'svg'
        data: Export data payload
        options: Format-specific options

    Returns:
        dict with 'filepath' key pointing to the generated file
    """
    try:
        if export_type == "pdf":
            from ..export.pdf_report import generate_pdf
            filepath = generate_pdf(data, options)
        elif export_type == "gif":
            from ..export.gif_animator import generate_gif
            filepath = generate_gif(data, options)
        elif export_type == "dxf":
            from ..export.dxf_exporter import generate_dxf
            filepath = generate_dxf(data, options)
        elif export_type == "svg":
            from ..export.svg_exporter import generate_svg_export
            filepath = generate_svg_export(data, options)
        else:
            raise ValueError(f"Unknown export type: {export_type}")

        return {"filepath": filepath, "type": export_type}

    except Exception as e:
        error_msg = f"Export failed: {type(e).__name__}: {str(e)}"
        print(f"[Zxynth] Export error: {error_msg}")
        raise
