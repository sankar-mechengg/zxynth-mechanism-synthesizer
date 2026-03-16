"""
Slider-Crank Dimensional Synthesis

The slider-crank converts rotary motion to linear motion (or vice versa).
Key parameters: crank length (a2), connecting rod (a3), slider offset.

For path generation: the coupler point traces a curve that depends
on p, α (coupler point offset) in addition to a2, a3, offset.

For function generation: the output is slider displacement as a
function of crank angle — inherently non-linear.
"""

import numpy as np
from typing import Dict, Optional, Callable

from ...models.mechanism import SliderCrank
from ...kinematics.coupler_curve import generate_coupler_curve_slider_crank
from ...utils.error_metrics import compute_error_metrics


def synthesize_slider_crank(
    problem_type: str,
    desired_data: np.ndarray,
    algorithm: str,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Full slider-crank dimensional synthesis.

    Returns:
        dict with 'analytical', 'optimization'
    """
    result = {
        "analytical": None,
        "optimization": None,
        "cognates": None,  # No cognates for slider-crank
    }

    # ── Analytical (simple heuristic for slider-crank) ──────
    try:
        analytical = _analytical_slider_crank(desired_data)
        if analytical:
            mech = analytical["mechanism"]
            verified = _verify_slider_crank(mech, problem_type, desired_data)
            result["analytical"] = {
                **verified,
                "method": "Slider-crank geometric estimation",
                "precisionPoints": 2,
            }
    except Exception as e:
        result["analytical"] = {"warnings": [f"Analytical failed: {str(e)}"]}

    # ── Optimization ────────────────────────────────────────
    try:
        opt = _run_slider_crank_optimization(
            problem_type, desired_data, algorithm,
            constraints, hyperparams, progress_callback, timing_map,
        )

        if opt and opt.get("best_vector"):
            x = opt["best_vector"]
            mech = SliderCrank(
                a2=x[0], a3=x[1], offset=x[2],
                p=x[3], alpha=x[4],
                pivot_a=(x[5], x[6]),
                slider_angle=x[7], theta2_0=x[8],
            )
            verified = _verify_slider_crank(mech, problem_type, desired_data)
            result["optimization"] = {
                **verified,
                "algorithm": algorithm.upper(),
                "generations": opt.get("generations", 0),
                "elapsed": opt.get("elapsed", 0),
            }
    except Exception as e:
        result["optimization"] = {"warnings": [f"Optimization failed: {str(e)}"]}

    return result


def _analytical_slider_crank(desired_data: np.ndarray) -> Optional[Dict]:
    """
    Simple analytical estimate for slider-crank based on path extent.
    Uses the bounding box of the desired path to estimate crank and rod lengths.
    """
    if len(desired_data) < 2:
        return None

    xs = desired_data[:, 0]
    ys = desired_data[:, 1]
    x_range = float(np.max(xs) - np.min(xs))
    y_range = float(np.max(ys) - np.min(ys))
    extent = np.sqrt(x_range**2 + y_range**2)

    if extent < 1e-6:
        return None

    # Heuristic: crank ~ 1/4 of extent, rod ~ 3/4 of extent
    a2 = extent * 0.25
    a3 = extent * 0.75

    # Center the pivot
    cx = float(np.mean(xs))
    cy = float(np.min(ys)) - extent * 0.3

    mech = SliderCrank(
        a2=a2, a3=a3, offset=0.0,
        p=extent * 0.5, alpha=45.0,
        pivot_a=(cx, cy),
        slider_angle=0.0,
    )

    return {"mechanism": mech, "method": "Geometric estimation"}


def _run_slider_crank_optimization(
    problem_type, desired_data, algorithm,
    constraints, hyperparams, progress_callback, timing_map,
) -> Optional[Dict]:
    """Run optimization for slider-crank."""
    if algorithm == "de":
        from ..optimization.differential_evolution import run_de_optimization
        return run_de_optimization(
            problem_type, "slider_crank", desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "ga":
        from ..optimization.genetic_algorithm import run_ga_optimization
        return run_ga_optimization(
            problem_type, "slider_crank", desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "pso":
        from ..optimization.particle_swarm import run_pso_optimization
        return run_pso_optimization(
            problem_type, "slider_crank", desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "sa":
        from ..optimization.simulated_annealing import run_sa_optimization
        return run_sa_optimization(
            problem_type, "slider_crank", desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    return None


def _verify_slider_crank(mech: SliderCrank, problem_type: str, desired_data: np.ndarray) -> Dict:
    """Verify a slider-crank mechanism."""
    result = {"mechanism": mech.to_dict()}

    curve = generate_coupler_curve_slider_crank(mech, 360)
    if len(curve) > 0:
        result["couplerCurve"] = curve.tolist()

    if problem_type == "path" and len(curve) > 0:
        result["errorMetrics"] = compute_error_metrics(desired_data, curve)

    # Slider-crank is always "Grashof" if a2 < a3 (crank can rotate fully)
    if mech.a2 < mech.a3:
        result["grashofType"] = "crank-rocker"
    else:
        result["grashofType"] = "non-grashof"

    result["transmissionAngle"] = {"min": 30.0, "max": 150.0}  # Approximate for slider-crank

    return result
