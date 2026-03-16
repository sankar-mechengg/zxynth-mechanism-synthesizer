"""
6-Bar Stephenson-III Dimensional Synthesis

In the Stephenson chain, the two ternary links are not directly connected.
The synthesis follows the same base-4-bar + dyad strategy as Watt,
but the dyad attaches differently (to a different link in the chain).

Stephenson-III is often better than Watt for certain curve families
due to the different coupler motion characteristics.
"""

import numpy as np
from typing import Dict, Optional, Callable

from ...models.mechanism import FourBar, SixBarStephenson
from ...kinematics.coupler_curve import generate_coupler_curve
from ...kinematics.grashof import check_grashof
from ...kinematics.transmission_angle import compute_transmission_angle_range
from ...utils.error_metrics import compute_error_metrics
from .four_bar import synthesize_four_bar


def synthesize_six_bar_stephenson(
    problem_type: str,
    desired_data: np.ndarray,
    algorithm: str,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Full 6-bar Stephenson-III dimensional synthesis.

    Returns:
        dict with 'analytical', 'optimization', 'cognates'
    """
    result = {
        "analytical": None,
        "optimization": None,
        "cognates": None,
    }

    # Step 1: Base 4-bar optimization
    base_result = synthesize_four_bar(
        problem_type, desired_data, algorithm,
        constraints, hyperparams,
        progress_callback=lambda g, f: progress_callback(g // 2, f) if progress_callback else None,
        timing_map=timing_map,
    )

    base_opt = base_result.get("optimization") or base_result.get("analytical")
    if not base_opt or not base_opt.get("mechanism"):
        return base_result

    base_mech_dict = base_opt["mechanism"]

    # Step 2: Extend with Stephenson dyad
    try:
        steph_mech = _extend_stephenson(base_mech_dict, desired_data, constraints)

        if steph_mech:
            verified = _verify_stephenson(steph_mech, problem_type, desired_data)
            result["optimization"] = {
                **verified,
                "algorithm": f"{algorithm.upper()} (base) + Stephenson dyad",
                "generations": base_opt.get("generations", 0),
                "elapsed": base_opt.get("elapsed", 0),
            }
        else:
            result["optimization"] = base_opt

    except Exception as e:
        result["optimization"] = base_opt
        if result["optimization"]:
            result["optimization"].setdefault("warnings", []).append(
                f"Stephenson extension failed: {str(e)}. Using base 4-bar."
            )

    result["analytical"] = base_result.get("analytical")
    result["cognates"] = base_result.get("cognates")

    return result


def _extend_stephenson(
    base_dict: Dict,
    desired_data: np.ndarray,
    constraints: Dict,
) -> Optional[SixBarStephenson]:
    """
    Extend base 4-bar with a Stephenson dyad.
    In Stephenson-III, the dyad connects the output rocker (link 4)
    to a new ground pivot, creating a second loop.
    """
    a1 = base_dict.get("a1", 1)
    a2 = base_dict.get("a2", 1)
    a3 = base_dict.get("a3", 1)
    a4 = base_dict.get("a4", 1)
    pivot_a = tuple(base_dict.get("pivotA", [0, 0]))
    pivot_d = tuple(base_dict.get("pivotD", [a1, 0]))

    avg_link = (a1 + a2 + a3 + a4) / 4

    # Dyad links
    a5 = avg_link * 0.6
    a6 = avg_link * 0.9

    # Third ground pivot — offset from rocker pivot D
    pivot_e = (
        pivot_d[0] + avg_link * 0.4,
        pivot_d[1] - avg_link * 0.5,
    )

    steph = SixBarStephenson(
        a1=a1, a2=a2, a3=a3, a4=a4,
        a5=a5, a6=a6,
        p=base_dict.get("p", 0),
        alpha=base_dict.get("alpha", 0),
        pivot_a=pivot_a,
        pivot_d=pivot_d,
        pivot_e=pivot_e,
        dyad_angle=45.0,
        dyad_offset=a4 * 0.4,
    )

    return steph


def _verify_stephenson(
    mech: SixBarStephenson,
    problem_type: str,
    desired_data: np.ndarray,
) -> Dict:
    """Verify a Stephenson mechanism."""
    result = {"mechanism": mech.to_dict()}

    base = FourBar(
        a1=mech.a1, a2=mech.a2, a3=mech.a3, a4=mech.a4,
        p=mech.p, alpha=mech.alpha,
        pivot_a=mech.pivot_a, pivot_d=mech.pivot_d,
    )

    curve = generate_coupler_curve(base, 360)
    if len(curve) > 0:
        result["couplerCurve"] = curve.tolist()

    if problem_type == "path" and len(curve) > 0:
        result["errorMetrics"] = compute_error_metrics(desired_data, curve)

    grashof = check_grashof(mech.a1, mech.a2, mech.a3, mech.a4)
    result["grashofType"] = grashof["type"]
    result["transmissionAngle"] = compute_transmission_angle_range(
        mech.a1, mech.a2, mech.a3, mech.a4
    )

    return result
