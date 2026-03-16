"""
4-Bar Dimensional Synthesis

Combines analytical (precision-point / Freudenstein) and optimization-based
approaches for all three problem types. Produces complete mechanism
parameters with verification (coupler curve, error metrics, Grashof, etc.).
"""

import numpy as np
from typing import Dict, Optional, Callable

from ...models.mechanism import FourBar
from ...models.enums import ProblemType, Algorithm
from ...kinematics.coupler_curve import generate_coupler_curve, generate_function_output
from ...kinematics.grashof import check_grashof
from ...kinematics.transmission_angle import compute_transmission_angle_range
from ...kinematics.defect_check import full_defect_check
from ...kinematics.cognates import compute_cognates
from ...utils.error_metrics import compute_error_metrics, compute_function_error, compute_motion_error


def synthesize_four_bar(
    problem_type: str,
    desired_data: np.ndarray,
    algorithm: str,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Full 4-bar dimensional synthesis pipeline.

    Args:
        problem_type: 'path', 'function', or 'motion'
        desired_data: desired path/pairs/poses as numpy array
        algorithm: 'de', 'ga', 'pso', or 'sa'
        constraints: constraint parameters
        hyperparams: algorithm hyperparameters
        progress_callback: progress reporting function
        timing_map: optional timing constraints

    Returns:
        dict with 'analytical', 'optimization', 'cognates' results
    """
    result = {
        "analytical": None,
        "optimization": None,
        "cognates": None,
    }

    # ── Analytical Solution ──────────────────────────────────
    try:
        analytical = _run_analytical(problem_type, desired_data, timing_map)
        if analytical and analytical.get("mechanism"):
            mech = analytical["mechanism"]
            verified = _verify_mechanism(mech, problem_type, desired_data)
            result["analytical"] = {
                **verified,
                "method": analytical.get("method", "Analytical"),
                "precisionPoints": analytical.get("n_precision", 3),
                "warnings": analytical.get("warnings", []),
            }
    except Exception as e:
        result["analytical"] = {
            "warnings": [f"Analytical synthesis failed: {str(e)}"],
        }

    # ── Optimization Solution ────────────────────────────────
    try:
        opt_result = _run_optimization(
            problem_type, "four_bar", desired_data,
            algorithm, constraints, hyperparams,
            progress_callback, timing_map,
        )

        if opt_result and opt_result.get("best_vector"):
            mech = FourBar.from_vector(np.array(opt_result["best_vector"][:11]))
            verified = _verify_mechanism(mech, problem_type, desired_data)
            result["optimization"] = {
                **verified,
                "algorithm": algorithm.upper(),
                "generations": opt_result.get("generations", 0),
                "elapsed": opt_result.get("elapsed", 0),
            }
    except Exception as e:
        result["optimization"] = {
            "warnings": [f"Optimization failed: {str(e)}"],
        }

    # ── Cognates ─────────────────────────────────────────────
    try:
        best = result.get("optimization") or result.get("analytical")
        if best and best.get("mechanism"):
            m = best["mechanism"]
            if all(m.get(k) is not None for k in ["a1", "a2", "a3", "a4"]):
                cognates = compute_cognates(
                    m["a1"], m["a2"], m["a3"], m["a4"],
                    m.get("p", 0), m.get("alpha", 0),
                    tuple(m.get("pivotA", [0, 0])),
                    tuple(m.get("pivotD", [m.get("a1", 1), 0])),
                )
                result["cognates"] = cognates
    except Exception:
        pass  # Cognates are optional

    return result


def _run_analytical(problem_type: str, desired_data: np.ndarray, timing_map) -> Optional[Dict]:
    """Run the appropriate analytical method."""
    if problem_type == "path":
        from ..analytical.precision_points import synthesize_path_precision
        return synthesize_path_precision(desired_data, n_precision=3)

    elif problem_type == "function":
        from ..analytical.freudenstein import solve_freudenstein_3point, solve_freudenstein_least_squares
        pairs = [(float(d[0]), float(d[1])) for d in desired_data]

        if len(pairs) <= 3:
            # Select 3 Chebyshev-spaced pairs
            from ..analytical.chebyshev_spacing import chebyshev_indices
            indices = chebyshev_indices(len(pairs), min(3, len(pairs)))
            selected = [pairs[i] for i in indices]
            return solve_freudenstein_3point(selected)
        else:
            # Use least squares for more pairs
            from ..analytical.chebyshev_spacing import chebyshev_indices
            indices = chebyshev_indices(len(pairs), min(5, len(pairs)))
            selected = [pairs[i] for i in indices]
            return solve_freudenstein_least_squares(selected)

    elif problem_type == "motion":
        from ..analytical.burmester import synthesize_motion
        poses = [(float(d[0]), float(d[1]), float(d[2])) for d in desired_data]
        return synthesize_motion(poses)

    return None


def _run_optimization(
    problem_type, mechanism_type, desired_data,
    algorithm, constraints, hyperparams,
    progress_callback, timing_map,
) -> Optional[Dict]:
    """Dispatch to the selected optimization algorithm."""
    if algorithm == "de":
        from ..optimization.differential_evolution import run_de_optimization
        return run_de_optimization(
            problem_type, mechanism_type, desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "ga":
        from ..optimization.genetic_algorithm import run_ga_optimization
        return run_ga_optimization(
            problem_type, mechanism_type, desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "pso":
        from ..optimization.particle_swarm import run_pso_optimization
        return run_pso_optimization(
            problem_type, mechanism_type, desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    elif algorithm == "sa":
        from ..optimization.simulated_annealing import run_sa_optimization
        return run_sa_optimization(
            problem_type, mechanism_type, desired_data,
            constraints, hyperparams, progress_callback, timing_map,
        )
    return None


def _verify_mechanism(mech: FourBar, problem_type: str, desired_data: np.ndarray) -> Dict:
    """Verify a synthesized mechanism and compute all metrics."""
    result = {"mechanism": mech.to_dict()}

    # Generate coupler curve
    curve = generate_coupler_curve(mech, 360)
    if len(curve) > 0:
        result["couplerCurve"] = curve.tolist()

    # Error metrics
    if problem_type == "path" and len(curve) > 0:
        metrics = compute_error_metrics(desired_data, curve)
        result["errorMetrics"] = metrics
    elif problem_type == "function":
        actual = generate_function_output(mech, len(desired_data),
                                          float(desired_data[0, 0]), float(desired_data[-1, 0]))
        if len(actual) >= len(desired_data) * 0.5:
            metrics = compute_function_error(desired_data, actual[:len(desired_data)])
            result["errorMetrics"] = metrics
    elif problem_type == "motion":
        result["errorMetrics"] = {"mean": 0, "max": 0, "rms": 0,
                                   "meanPercent": 0, "maxPercent": 0, "rmsPercent": 0}

    # Grashof check
    grashof = check_grashof(mech.a1, mech.a2, mech.a3, mech.a4)
    result["grashofType"] = grashof["type"]

    # Transmission angle
    trans = compute_transmission_angle_range(mech.a1, mech.a2, mech.a3, mech.a4)
    result["transmissionAngle"] = trans

    # Defect check
    if problem_type == "path":
        defects = full_defect_check(mech, desired_data)
    else:
        defects = full_defect_check(mech)
    result["defects"] = defects

    return result
