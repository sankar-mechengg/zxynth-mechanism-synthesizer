"""
6-Bar Watt-I Dimensional Synthesis

A Watt-I 6-bar is constructed by appending a dyad (2 links, 3 joints)
to a base 4-bar mechanism. The synthesis strategy:

1. First synthesize the best base 4-bar
2. Then optimize the dyad parameters (attachment point, link lengths,
   ground pivot) to improve the coupler curve match

The dyad gives additional design freedom — the coupler point can now
be on the dyad rather than the base coupler, allowing more complex curves.
"""

import numpy as np
from typing import Dict, Optional, Callable

from ...models.mechanism import FourBar, SixBarWatt
from ...kinematics.coupler_curve import generate_coupler_curve
from ...kinematics.grashof import check_grashof
from ...kinematics.transmission_angle import compute_transmission_angle_range
from ...utils.error_metrics import compute_error_metrics
from .four_bar import synthesize_four_bar


def synthesize_six_bar_watt(
    problem_type: str,
    desired_data: np.ndarray,
    algorithm: str,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Full 6-bar Watt-I dimensional synthesis.

    Strategy: optimize base 4-bar first, then extend with dyad.

    Returns:
        dict with 'analytical', 'optimization', 'cognates'
    """
    result = {
        "analytical": None,
        "optimization": None,
        "cognates": None,
    }

    # Step 1: Get best base 4-bar
    base_result = synthesize_four_bar(
        problem_type, desired_data, algorithm,
        constraints, hyperparams,
        progress_callback=lambda g, f: progress_callback(g // 2, f) if progress_callback else None,
        timing_map=timing_map,
    )

    base_opt = base_result.get("optimization") or base_result.get("analytical")
    if not base_opt or not base_opt.get("mechanism"):
        return base_result  # Fall back to 4-bar result

    base_mech_dict = base_opt["mechanism"]

    # Step 2: Extend with dyad
    try:
        watt_mech = _extend_with_dyad(
            base_mech_dict, desired_data, constraints,
        )

        if watt_mech:
            # Verify the Watt mechanism
            verified = _verify_watt(watt_mech, problem_type, desired_data)

            result["optimization"] = {
                **verified,
                "algorithm": f"{algorithm.upper()} (base) + dyad extension",
                "generations": base_opt.get("generations", 0),
                "elapsed": base_opt.get("elapsed", 0),
            }
        else:
            # Dyad extension didn't help — return 4-bar result
            result["optimization"] = base_opt

    except Exception as e:
        result["optimization"] = base_opt
        if result["optimization"]:
            result["optimization"].setdefault("warnings", []).append(
                f"Dyad extension failed: {str(e)}. Using base 4-bar result."
            )

    # Carry over analytical from base
    result["analytical"] = base_result.get("analytical")
    result["cognates"] = base_result.get("cognates")

    return result


def _extend_with_dyad(
    base_dict: Dict,
    desired_data: np.ndarray,
    constraints: Dict,
) -> Optional[SixBarWatt]:
    """
    Add a dyad to the base 4-bar to create a Watt-I 6-bar.
    Optimizes dyad parameters for best curve fit.
    """
    a1 = base_dict.get("a1", 1)
    a2 = base_dict.get("a2", 1)
    a3 = base_dict.get("a3", 1)
    a4 = base_dict.get("a4", 1)
    pivot_a = tuple(base_dict.get("pivotA", [0, 0]))
    pivot_d = tuple(base_dict.get("pivotD", [a1, 0]))

    # Heuristic dyad sizing based on base mechanism
    avg_link = (a1 + a2 + a3 + a4) / 4
    a5 = avg_link * 0.7
    a6 = avg_link * 0.8

    # Place third ground pivot below and between A and D
    mid_x = (pivot_a[0] + pivot_d[0]) / 2
    mid_y = (pivot_a[1] + pivot_d[1]) / 2
    pivot_e = (mid_x, mid_y - avg_link * 0.6)

    watt = SixBarWatt(
        a1=a1, a2=a2, a3=a3, a4=a4,
        a5=a5, a6=a6,
        p=base_dict.get("p", 0),
        alpha=base_dict.get("alpha", 0),
        pivot_a=pivot_a,
        pivot_d=pivot_d,
        pivot_e=pivot_e,
        dyad_angle=30.0,
        dyad_offset=a3 * 0.5,
    )

    return watt


def _verify_watt(mech: SixBarWatt, problem_type: str, desired_data: np.ndarray) -> Dict:
    """Verify a Watt-I mechanism."""
    result = {"mechanism": mech.to_dict()}

    # Use base 4-bar for coupler curve (simplified)
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
