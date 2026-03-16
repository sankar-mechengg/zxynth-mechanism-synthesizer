"""
Constraint Penalty Functions

During optimization, constraints are enforced via penalty terms added to
the objective function. Infeasible solutions receive large penalties that
push the optimizer toward the feasible region.

Total penalized objective:
  f_penalized(x) = f_objective(x) + λ₁·grashof_penalty + λ₂·transmission_penalty
                   + λ₃·assembly_penalty + λ₄·link_ratio_penalty
"""

import numpy as np
from typing import Dict, Optional

from ...kinematics.grashof import grashof_penalty as _grashof_penalty
from ...kinematics.transmission_angle import transmission_angle_penalty as _trans_penalty


def compute_total_penalty(
    x: np.ndarray,
    mechanism_type: str = "four_bar",
    grashof_required: bool = True,
    grashof_margin: float = 5.0,
    min_transmission_angle: float = 40.0,
    max_link_ratio: float = 10.0,
    penalty_weights: Optional[Dict[str, float]] = None,
) -> float:
    """
    Compute total constraint penalty for a parameter vector.

    Args:
        x: parameter vector
        mechanism_type: mechanism type string
        grashof_required: enforce Grashof condition
        grashof_margin: required margin for Grashof (p+q) - (s+l) ≥ margin
        min_transmission_angle: minimum allowed μ in degrees
        max_link_ratio: maximum ratio between longest and shortest link
        penalty_weights: custom weights {grashof, transmission, assembly, ratio}

    Returns:
        total penalty value (0 = all constraints satisfied)
    """
    weights = {
        "grashof": 1000.0,
        "transmission": 500.0,
        "assembly": 2000.0,
        "ratio": 100.0,
        **(penalty_weights or {}),
    }

    total = 0.0

    if mechanism_type in ("four_bar", "six_bar_watt", "six_bar_stephenson"):
        a1, a2, a3, a4 = x[0], x[1], x[2], x[3]

        # Link positivity
        if any(l <= 0 for l in [a1, a2, a3, a4]):
            return 1e8

        # Grashof penalty
        if grashof_required:
            gp = _grashof_penalty(a1, a2, a3, a4, grashof_margin)
            total += weights["grashof"] * gp

        # Transmission angle penalty
        tp = _trans_penalty(a1, a2, a3, a4, min_transmission_angle, n_samples=36)
        total += weights["transmission"] * tp

        # Assembly penalty — check if mechanism can assemble at all
        ap = assembly_penalty(a1, a2, a3, a4)
        total += weights["assembly"] * ap

        # Link ratio penalty — prevent extreme proportions
        rp = link_ratio_penalty(a1, a2, a3, a4, max_link_ratio)
        total += weights["ratio"] * rp

    elif mechanism_type == "slider_crank":
        a2, a3 = x[0], x[1]
        if a2 <= 0 or a3 <= 0:
            return 1e8
        if a2 >= a3:
            # Crank must be shorter than connecting rod for full rotation
            total += weights["assembly"] * (a2 - a3 + 1) ** 2

    return total


def assembly_penalty(a1: float, a2: float, a3: float, a4: float) -> float:
    """
    Penalty for mechanisms that cannot physically assemble.

    A 4-bar can assemble only if the triangle inequality is satisfied
    for the three non-ground links when the crank is at any position:
      |a2 - a1| ≤ BD ≤ a2 + a1  (BD varies from |a1-a2| to a1+a2)
    and
      |a3 - a4| ≤ BD ≤ a3 + a4

    The mechanism must be able to close at at least one crank angle.
    """
    # Check if there's any overlap between the BD ranges
    # BD range from crank: [|a1 - a2|, a1 + a2]
    bd_min_crank = abs(a1 - a2)
    bd_max_crank = a1 + a2

    # BD range from coupler-rocker: [|a3 - a4|, a3 + a4]
    bd_min_cr = abs(a3 - a4)
    bd_max_cr = a3 + a4

    # Overlap check
    if bd_max_crank < bd_min_cr:
        # Crank-ground chain too short to reach coupler-rocker
        return (bd_min_cr - bd_max_crank) ** 2
    elif bd_min_crank > bd_max_cr:
        # Crank-ground chain too long for coupler-rocker
        return (bd_min_crank - bd_max_cr) ** 2

    return 0.0  # Assembles OK


def link_ratio_penalty(
    a1: float, a2: float, a3: float, a4: float,
    max_ratio: float = 10.0,
) -> float:
    """
    Penalty for extreme link length ratios.
    Mechanisms with very different link lengths are impractical
    (tiny crank with huge ground, etc.).
    """
    links = [a1, a2, a3, a4]
    min_l = min(links)
    max_l = max(links)

    if min_l <= 0:
        return 1e6

    ratio = max_l / min_l
    if ratio > max_ratio:
        return (ratio - max_ratio) ** 2

    return 0.0


def coupler_point_penalty(p: float, a3: float, max_ratio: float = 5.0) -> float:
    """
    Penalty for coupler point being too far from the coupler link.
    Very large p/a3 ratios make the mechanism impractical.
    """
    if a3 <= 0:
        return 1e6
    ratio = abs(p) / a3
    if ratio > max_ratio:
        return (ratio - max_ratio) ** 2
    return 0.0
