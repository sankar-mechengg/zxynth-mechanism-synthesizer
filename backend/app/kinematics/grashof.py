"""
Grashof Condition Checker

Determines whether a 4-bar linkage satisfies the Grashof condition
(s + l ≤ p + q) and classifies the mechanism type.
"""

import numpy as np
from typing import Dict, Tuple

from ..models.enums import GrashofType


def check_grashof(a1: float, a2: float, a3: float, a4: float) -> Dict:
    """
    Check Grashof condition and classify the mechanism.

    The Grashof condition: s + l ≤ p + q
    where s = shortest link, l = longest link, p, q = remaining two.

    Classification (when Grashof is satisfied):
    - If ground (a1) is adjacent to shortest → depends on which is shortest
    - s = a2 (crank): Crank-Rocker (most common)
    - s = a1 (ground): Double-Crank (drag link)
    - s = a3 (coupler): Double-Rocker (Grashof)
    - s = a4 (rocker): Crank-Rocker (with a4 as crank via inversion)

    Returns:
        dict with 'is_grashof', 'type', 'margin', 'links_sorted', etc.
    """
    links = np.array([a1, a2, a3, a4])
    sorted_links = np.sort(links)
    s = sorted_links[0]  # shortest
    l = sorted_links[3]  # longest
    p = sorted_links[1]
    q = sorted_links[2]

    margin = float((p + q) - (s + l))
    is_grashof = margin >= 0
    is_change_point = abs(margin) < 1e-10

    # Classify
    if is_change_point:
        grashof_type = GrashofType.CHANGE_POINT
    elif not is_grashof:
        grashof_type = GrashofType.NON_GRASHOF
    else:
        # Find which link is shortest
        shortest_idx = int(np.argmin(links))

        if shortest_idx == 0:
            # Ground is shortest → Double-Crank (both pivoted links rotate fully)
            grashof_type = GrashofType.DOUBLE_CRANK
        elif shortest_idx == 1:
            # Crank (input) is shortest → Crank-Rocker
            grashof_type = GrashofType.CRANK_ROCKER
        elif shortest_idx == 2:
            # Coupler is shortest → Double-Rocker (Grashof type)
            grashof_type = GrashofType.DOUBLE_ROCKER
        else:
            # Rocker (output) is shortest → Crank-Rocker (via inversion argument)
            # In standard configuration, if a4 is shortest, it acts as crank of the inverted mechanism
            # For our purposes (input at a2), this is still a rocker for a2
            grashof_type = GrashofType.CRANK_ROCKER

    return {
        "is_grashof": is_grashof,
        "type": grashof_type.value,
        "margin": round(margin, 6),
        "shortest": float(s),
        "longest": float(l),
        "links_sorted": [float(x) for x in sorted_links],
        "s_plus_l": round(float(s + l), 6),
        "p_plus_q": round(float(p + q), 6),
    }


def grashof_penalty(
    a1: float, a2: float, a3: float, a4: float,
    required_margin: float = 0.0,
) -> float:
    """
    Compute Grashof penalty for optimization.
    Returns 0 if Grashof condition is satisfied with the required margin,
    otherwise returns a positive penalty proportional to the violation.

    Args:
        a1-a4: link lengths
        required_margin: minimum required margin (s+l) - (p+q) ≤ -required_margin

    Returns:
        penalty value (0 = feasible)
    """
    links = np.sort([a1, a2, a3, a4])
    s, l = links[0], links[3]
    p, q = links[1], links[2]

    violation = (s + l) - (p + q) + required_margin
    if violation <= 0:
        return 0.0

    # Quadratic penalty
    return violation ** 2
