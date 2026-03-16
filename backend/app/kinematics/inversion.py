"""
Kinematic Inversion

Fixing a different link as ground in the same kinematic chain
creates a different mechanism with different motion characteristics
but the same DOF.

For a 4-bar with links [a1, a2, a3, a4]:
  - Inversion 0: Fix link 1 (original) — a1=ground, a2=crank, a3=coupler, a4=rocker
  - Inversion 1: Fix link 2 — a2=ground, a3=crank, a4=coupler, a1=rocker
  - Inversion 2: Fix link 3 — a3=ground, a4=crank, a1=coupler, a2=rocker
  - Inversion 3: Fix link 4 — a4=ground, a1=crank, a2=coupler, a3=rocker
"""

import numpy as np
from typing import Dict, Optional

from .grashof import check_grashof
from .transmission_angle import compute_transmission_angle_range
from .coupler_curve import generate_coupler_curve
from ..models.mechanism import FourBar


def compute_inversion(
    mechanism_dict: Dict,
    fixed_link_index: int,
) -> Dict:
    """
    Compute kinematic inversion by fixing a different link as ground.

    Args:
        mechanism_dict: mechanism parameters dict (from MechanismParams schema)
        fixed_link_index: 0-3, which link to fix as ground

    Returns:
        dict with inverted mechanism params, Grashof check, transmission angle
    """
    a1 = mechanism_dict.get("a1", 0)
    a2 = mechanism_dict.get("a2", 0)
    a3 = mechanism_dict.get("a3", 0)
    a4 = mechanism_dict.get("a4", 0)

    links = [a1, a2, a3, a4]

    if fixed_link_index < 0 or fixed_link_index > 3:
        raise ValueError(f"fixed_link_index must be 0-3, got {fixed_link_index}")

    if fixed_link_index == 0:
        # Original configuration — no change
        inv_ground = a1
        inv_crank = a2
        inv_coupler = a3
        inv_rocker = a4
    elif fixed_link_index == 1:
        # Fix link 2 as ground
        inv_ground = a2
        inv_crank = a3
        inv_coupler = a4
        inv_rocker = a1
    elif fixed_link_index == 2:
        # Fix link 3 (coupler) as ground
        inv_ground = a3
        inv_crank = a4
        inv_coupler = a1
        inv_rocker = a2
    else:
        # Fix link 4 as ground
        inv_ground = a4
        inv_crank = a1
        inv_coupler = a2
        inv_rocker = a3

    # Grashof check for inverted mechanism
    grashof = check_grashof(inv_ground, inv_crank, inv_coupler, inv_rocker)

    # Transmission angle range
    trans = compute_transmission_angle_range(inv_ground, inv_crank, inv_coupler, inv_rocker)

    # Create inverted mechanism for coupler curve generation
    inv_mech = FourBar(
        a1=inv_ground, a2=inv_crank, a3=inv_coupler, a4=inv_rocker,
        p=mechanism_dict.get("p", 0),
        alpha=mechanism_dict.get("alpha", 0),
        pivot_a=(0, 0),
        pivot_d=(inv_ground, 0),
    )

    # Generate coupler curve
    curve = generate_coupler_curve(inv_mech, n_points=180)
    coupler_curve = curve.tolist() if len(curve) > 0 else []

    return {
        "fixedLink": fixed_link_index,
        "mechanism": {
            "a1": round(inv_ground, 4),
            "a2": round(inv_crank, 4),
            "a3": round(inv_coupler, 4),
            "a4": round(inv_rocker, 4),
            "type": "four_bar",
            "pivotA": [0, 0],
            "pivotD": [round(inv_ground, 4), 0],
        },
        "grashofType": grashof["type"],
        "grashofMargin": grashof["margin"],
        "transmissionAngle": trans,
        "couplerCurve": coupler_curve,
        "description": _inversion_description(fixed_link_index, grashof["type"]),
    }


def get_all_inversions(mechanism_dict: Dict) -> list:
    """Compute all 4 inversions of a 4-bar mechanism."""
    results = []
    for i in range(4):
        try:
            inv = compute_inversion(mechanism_dict, i)
            results.append(inv)
        except Exception as e:
            results.append({
                "fixedLink": i,
                "error": str(e),
            })
    return results


def _inversion_description(fixed_link_index: int, grashof_type: str) -> str:
    """Generate a human-readable description of the inversion."""
    link_names = ["Ground (L1)", "Crank (L2)", "Coupler (L3)", "Rocker (L4)"]
    fixed_name = link_names[fixed_link_index]

    type_descriptions = {
        "crank-rocker": "Input link rotates fully; output link oscillates.",
        "double-crank": "Both pivoted links can make full rotations (drag link).",
        "double-rocker": "Neither pivoted link rotates fully; both oscillate.",
        "change-point": "At the Grashof boundary — may lock or switch modes.",
        "non-grashof": "No link can make full rotations; all oscillate within limited ranges.",
    }

    desc = f"Fixed: {fixed_name}. "
    desc += type_descriptions.get(grashof_type, f"Type: {grashof_type}")
    return desc
