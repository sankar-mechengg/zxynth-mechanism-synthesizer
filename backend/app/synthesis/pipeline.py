"""
Master Synthesis Pipeline

Orchestrates the full synthesis workflow:
  1. Validate and preprocess input data
  2. Type synthesis — classify problem, recommend approach
  3. Number synthesis — verify DOF, select topology
  4. Dimensional synthesis — run analytical + optimization
  5. Assemble and return complete results

This is the function called by the Celery task (run_synthesis).
"""

import numpy as np
from typing import Dict, Optional, Callable

from ..models.enums import ProblemType, MechanismType, Algorithm
from .type_synthesis import run_type_synthesis
from .number_synthesis import run_number_synthesis


def run_synthesis_pipeline(
    request: Dict,
    progress_callback: Optional[Callable] = None,
) -> Dict:
    """
    Run the complete synthesis pipeline.

    Args:
        request: SynthesisRequest as dict (from API)
        progress_callback: called with (generation, best_fitness)

    Returns:
        FullSynthesisResult as dict: {analytical, optimization, cognates}
    """
    # ── Parse Request ────────────────────────────────────────
    problem_type = request.get("problemType", "path")
    # mechanismType is critical for 6-bar dispatch; support both camelCase and snake_case
    mechanism_type = (
        request.get("mechanismType")
        or request.get("mechanism_type")
        or "four_bar"
    )
    if hasattr(mechanism_type, "value"):
        mechanism_type = mechanism_type.value
    algorithm = request.get("algorithm", "de")
    hyperparams = request.get("hyperparams", {})
    constraints = request.get("constraints", {})

    # ── Validate and Prepare Input Data ──────────────────────
    desired_data = _prepare_input_data(request, problem_type)
    if desired_data is None or len(desired_data) < 2:
        raise ValueError("Insufficient input data for synthesis")

    # Timing map (for prescribed-timing path generation)
    timing_map = None
    if problem_type == "path" and request.get("prescribedTiming"):
        raw_timing = request.get("timingMap", [])
        if raw_timing:
            timing_map = [
                (int(t.get("pointIndex", t[0]) if isinstance(t, dict) else t[0]),
                 float(t.get("crankAngle", t[1]) if isinstance(t, dict) else t[1]))
                for t in raw_timing
            ]

    # ── Stage 1: Type Synthesis ──────────────────────────────
    type_result = run_type_synthesis(
        ProblemType(problem_type),
        MechanismType(mechanism_type),
        num_desired_points=len(desired_data) if problem_type == "path" else 0,
        num_poses=len(desired_data) if problem_type == "motion" else 0,
        num_function_pairs=len(desired_data) if problem_type == "function" else 0,
        has_timing=timing_map is not None,
    )

    # ── Stage 2: Number Synthesis ────────────────────────────
    number_result = run_number_synthesis(MechanismType(mechanism_type))

    if not number_result.get("dof_valid"):
        raise ValueError(
            f"DOF = {number_result['dof']} for {mechanism_type}. "
            f"Expected DOF = 1 for a single-input mechanism."
        )

    # ── Stage 3: Dimensional Synthesis ───────────────────────
    dim_result = _run_dimensional_synthesis(
        problem_type=problem_type,
        mechanism_type=mechanism_type,
        desired_data=desired_data,
        algorithm=algorithm,
        constraints=constraints,
        hyperparams=hyperparams,
        progress_callback=progress_callback,
        timing_map=timing_map,
    )

    # ── Assemble Final Result ────────────────────────────────
    result = {
        "analytical": dim_result.get("analytical"),
        "optimization": dim_result.get("optimization"),
        "cognates": dim_result.get("cognates"),
        # Include synthesis metadata
        "metadata": {
            "problemType": problem_type,
            "mechanismType": mechanism_type,
            "algorithm": algorithm,
            "numInputPoints": len(desired_data),
            "typeSynthesis": type_result,
            "numberSynthesis": {
                "n": number_result["n"],
                "j1": number_result["j1"],
                "dof": number_result["dof"],
                "topology": number_result["topology"],
            },
        },
    }

    return result


def _prepare_input_data(request: Dict, problem_type: str) -> Optional[np.ndarray]:
    """
    Extract and validate input data from the request.
    Converts to numpy array with appropriate shape.
    """
    if problem_type == "path":
        raw = request.get("desiredPath")
        if not raw:
            return None
        data = np.array(raw, dtype=float)
        if data.ndim == 1:
            data = data.reshape(-1, 2)
        if data.shape[1] != 2:
            raise ValueError(f"Path data must have 2 columns (x, y), got {data.shape[1]}")
        return data

    elif problem_type == "function":
        func_data = request.get("functionData", {})
        raw = func_data.get("pairs")
        if not raw:
            return None
        data = np.array(raw, dtype=float)
        if data.ndim == 1:
            data = data.reshape(-1, 2)
        if data.shape[1] != 2:
            raise ValueError(f"Function data must have 2 columns (θ_in, θ_out), got {data.shape[1]}")
        return data

    elif problem_type == "motion":
        raw = request.get("poses")
        if not raw:
            return None
        data = np.array(raw, dtype=float)
        if data.ndim == 1:
            data = data.reshape(-1, 3)
        if data.shape[1] != 3:
            raise ValueError(f"Pose data must have 3 columns (x, y, θ), got {data.shape[1]}")
        return data

    return None


def _run_dimensional_synthesis(
    problem_type: str,
    mechanism_type: str,
    desired_data: np.ndarray,
    algorithm: str,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable],
    timing_map: list,
) -> Dict:
    """Dispatch to the appropriate dimensional synthesis module."""

    if mechanism_type == "four_bar":
        from .dimensional.four_bar import synthesize_four_bar
        return synthesize_four_bar(
            problem_type, desired_data, algorithm,
            constraints, hyperparams, progress_callback, timing_map,
        )

    elif mechanism_type == "six_bar_watt":
        from .dimensional.six_bar_watt import synthesize_six_bar_watt
        return synthesize_six_bar_watt(
            problem_type, desired_data, algorithm,
            constraints, hyperparams, progress_callback, timing_map,
        )

    elif mechanism_type == "six_bar_stephenson":
        from .dimensional.six_bar_stephenson import synthesize_six_bar_stephenson
        return synthesize_six_bar_stephenson(
            problem_type, desired_data, algorithm,
            constraints, hyperparams, progress_callback, timing_map,
        )

    elif mechanism_type == "slider_crank":
        from .dimensional.slider_crank import synthesize_slider_crank
        return synthesize_slider_crank(
            problem_type, desired_data, algorithm,
            constraints, hyperparams, progress_callback, timing_map,
        )

    else:
        raise ValueError(f"Unknown mechanism type: {mechanism_type}")
