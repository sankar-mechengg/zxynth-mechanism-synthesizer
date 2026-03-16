"""
Roberts-Chebyshev Cognate Computation

For any 4-bar linkage, there exist exactly two other 4-bar linkages
(cognates) that generate the identical coupler curve. These are found
by constructing parallelogram linkages on each side of the original.

The three cognates share the same coupler curve but have different:
- Link lengths
- Ground pivot locations
- Mechanism proportions

This is useful when the original mechanism has unfavorable pivot
locations or link proportions — a cognate may fit physical constraints better.

Reference: Roberts-Chebyshev theorem (1875/1878)
"""

import numpy as np
from typing import List, Dict, Optional


def compute_cognates(
    a1: float, a2: float, a3: float, a4: float,
    p: float, alpha_deg: float,
    pivot_a: tuple = (0.0, 0.0),
    pivot_d: tuple = None,
) -> List[Dict]:
    """
    Compute all three Roberts-Chebyshev cognates for a 4-bar linkage.

    The original mechanism has:
      - Ground: A-D (length a1)
      - Crank: A-B (length a2)
      - Coupler: B-C (length a3), coupler point P at distance p, angle alpha from B
      - Rocker: D-C (length a4)

    Returns:
        list of 3 dicts, each with keys: a1, a2, a3, a4, p, alpha,
        pivotA, pivotD, label
    """
    alpha = np.radians(alpha_deg)

    # Coupler triangle sides: B-P = p, B-C = a3
    # Angle at B between BP and BC = alpha
    # P-C distance by law of cosines:
    pc = np.sqrt(p**2 + a3**2 - 2 * p * a3 * np.cos(alpha))

    if pc < 1e-10:
        # Degenerate: coupler point coincides with C
        pc = 1e-10

    # Angle at P in triangle BPC
    if pc > 0 and a3 > 0:
        cos_beta = (p**2 + pc**2 - a3**2) / (2 * p * pc)
        cos_beta = np.clip(cos_beta, -1, 1)
        beta = np.arccos(cos_beta)
    else:
        beta = 0.0

    # Angle at C in triangle BPC
    if pc > 0 and p > 0:
        cos_gamma = (a3**2 + pc**2 - p**2) / (2 * a3 * pc)
        cos_gamma = np.clip(cos_gamma, -1, 1)
        gamma = np.arccos(cos_gamma)
    else:
        gamma = 0.0

    # ──── Cognate 1: Original mechanism ────
    cog1 = {
        "a1": a1,
        "a2": a2,
        "a3": a3,
        "a4": a4,
        "p": p,
        "alpha": alpha_deg,
        "pivotA": list(pivot_a),
        "pivotD": list(pivot_d) if pivot_d else [pivot_a[0] + a1, pivot_a[1]],
        "label": "Original",
    }

    # ──── Cognate 2: Constructed from the A-B-P side ────
    # Link ratios from Roberts' construction:
    # Cognate 2 ground: A-D2, crank: A-B2, coupler: B2-C2, rocker: D2-C2
    # where the new links are proportional through the coupler triangle

    # Scale factors from the coupler triangle
    # Cognate 2: scale by (p / a3)
    scale2 = p / a3 if a3 > 0 else 1.0

    cog2_a2 = a2 * scale2          # new crank
    cog2_a4 = a4 * scale2          # new rocker
    cog2_a3 = pc                    # new coupler = P-C distance
    cog2_a1 = a1 * scale2          # new ground

    # Coupler point for cognate 2
    cog2_p = a3 * scale2  # = p * a3 / a3 = p ... but referenced differently
    cog2_alpha = alpha_deg  # same coupler point relationship

    # Ground pivot offset for cognate 2
    # The second cognate's ground pivot A2 coincides with original A
    # Its ground pivot D2 is offset from D
    ax, ay = pivot_a
    if pivot_d:
        dx, dy = pivot_d
    else:
        dx, dy = ax + a1, ay

    ground_angle = np.arctan2(dy - ay, dx - ax)

    # Cognate 2 ground pivots
    cog2_pivot_a = (ax, ay)  # Same A
    cog2_pivot_d = (
        ax + cog2_a1 * np.cos(ground_angle),
        ay + cog2_a1 * np.sin(ground_angle),
    )

    cog2 = {
        "a1": round(cog2_a1, 6),
        "a2": round(cog2_a2, 6),
        "a3": round(cog2_a3, 6),
        "a4": round(cog2_a4, 6),
        "p": round(p, 6),
        "alpha": round(np.degrees(beta), 4),
        "pivotA": [round(x, 4) for x in cog2_pivot_a],
        "pivotD": [round(x, 4) for x in cog2_pivot_d],
        "label": "Cognate 2",
    }

    # ──── Cognate 3: Constructed from the D-C-P side ────
    scale3 = pc / a3 if a3 > 0 else 1.0

    cog3_a2 = a2 * scale3
    cog3_a4 = a4  # Rocker stays same in this construction
    cog3_a3 = p   # New coupler = original coupler point distance
    cog3_a1 = a1 * scale3

    # Ground pivots for cognate 3
    cog3_pivot_a = (
        dx - cog3_a1 * np.cos(ground_angle),
        dy - cog3_a1 * np.sin(ground_angle),
    )
    cog3_pivot_d = (dx, dy)  # Same D

    cog3 = {
        "a1": round(cog3_a1, 6),
        "a2": round(cog3_a2, 6),
        "a3": round(cog3_a3, 6),
        "a4": round(cog3_a4, 6),
        "p": round(pc, 6),
        "alpha": round(np.degrees(gamma), 4),
        "pivotA": [round(x, 4) for x in cog3_pivot_a],
        "pivotD": [round(x, 4) for x in cog3_pivot_d],
        "label": "Cognate 3",
    }

    return [cog1, cog2, cog3]


def verify_cognate(
    original: Dict,
    cognate: Dict,
    n_samples: int = 36,
) -> Dict:
    """
    Verify that a cognate traces the same coupler curve as the original.

    Returns:
        dict with 'max_deviation', 'mean_deviation', 'is_valid'
    """
    from .coupler_curve import generate_coupler_curve
    from ..models.mechanism import FourBar
    from ..utils.curve_utils import closest_point_distances

    orig_mech = FourBar(
        a1=original["a1"], a2=original["a2"],
        a3=original["a3"], a4=original["a4"],
        p=original["p"], alpha=original["alpha"],
        pivot_a=tuple(original["pivotA"]),
        pivot_d=tuple(original["pivotD"]),
    )

    cog_mech = FourBar(
        a1=cognate["a1"], a2=cognate["a2"],
        a3=cognate["a3"], a4=cognate["a4"],
        p=cognate["p"], alpha=cognate["alpha"],
        pivot_a=tuple(cognate["pivotA"]),
        pivot_d=tuple(cognate["pivotD"]),
    )

    orig_curve = generate_coupler_curve(orig_mech, n_samples)
    cog_curve = generate_coupler_curve(cog_mech, n_samples)

    if len(orig_curve) < 2 or len(cog_curve) < 2:
        return {"max_deviation": float("inf"), "mean_deviation": float("inf"), "is_valid": False}

    distances = closest_point_distances(orig_curve, cog_curve)

    return {
        "max_deviation": round(float(np.max(distances)), 6),
        "mean_deviation": round(float(np.mean(distances)), 6),
        "is_valid": float(np.max(distances)) < 1.0,  # Tolerance for numerical error
    }
