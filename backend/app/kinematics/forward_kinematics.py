"""
Forward Kinematics

Given mechanism parameters and an input angle, compute the position
of every joint and the coupler tracing point.
"""

import numpy as np
from typing import Dict, Optional, List, Tuple

from .loop_closure import solve_four_bar, solve_slider_crank, solve_six_bar_watt
from ..models.mechanism import FourBar, SixBarWatt, SixBarStephenson, SliderCrank


def forward_kinematics_four_bar(
    mech: FourBar,
    theta2_deg: float,
    branch: int = 0,
) -> Optional[Dict]:
    """
    Compute all positions for a 4-bar at given crank angle.

    Returns:
        dict with 'joints' (list of {name, x, y, type, isFixed}),
        'links' (list of {start, end, name}),
        'couplerPoint' {x, y},
        'angles' {theta2, theta3, theta4} in degrees
    """
    theta2 = np.radians(theta2_deg)

    result = solve_four_bar(
        mech.a1, mech.a2, mech.a3, mech.a4,
        theta2,
        pivot_a=mech.pivot_a,
        pivot_d=mech.pivot_d,
        branch=branch,
    )

    if result is None:
        return None

    A = result["A"]
    B = result["B"]
    C = result["C"]
    D = result["D"]
    theta3 = result["theta3"]

    # Coupler point P
    alpha_rad = np.radians(mech.alpha)
    px = B[0] + mech.p * np.cos(theta3 + alpha_rad)
    py = B[1] + mech.p * np.sin(theta3 + alpha_rad)

    return {
        "joints": [
            {"name": "J1", "x": A[0], "y": A[1], "type": "revolute", "isFixed": True},
            {"name": "J2", "x": B[0], "y": B[1], "type": "revolute", "isFixed": False},
            {"name": "J3", "x": C[0], "y": C[1], "type": "revolute", "isFixed": False},
            {"name": "J4", "x": D[0], "y": D[1], "type": "revolute", "isFixed": True},
        ],
        "links": [
            {"start": A, "end": D, "name": "L1", "isGround": True, "isCoupler": False},
            {"start": A, "end": B, "name": "L2", "isGround": False, "isCoupler": False},
            {"start": B, "end": C, "name": "L3", "isGround": False, "isCoupler": True},
            {"start": D, "end": C, "name": "L4", "isGround": False, "isCoupler": False},
        ],
        "couplerPoint": {"x": float(px), "y": float(py)},
        "angles": {
            "theta2": float(np.degrees(result["theta2"])),
            "theta3": float(np.degrees(result["theta3"])),
            "theta4": float(np.degrees(result["theta4"])),
        },
    }


def forward_kinematics_slider_crank(
    mech: SliderCrank,
    theta2_deg: float,
    branch: int = 0,
) -> Optional[Dict]:
    """Compute all positions for a slider-crank at given crank angle."""
    theta2 = np.radians(theta2_deg)

    result = solve_slider_crank(
        mech.a2, mech.a3, theta2,
        offset=mech.offset,
        pivot_a=mech.pivot_a,
        slider_angle=np.radians(mech.slider_angle),
        branch=branch,
    )

    if result is None:
        return None

    A = result["A"]
    B = result["B"]
    C = result["C"]
    theta3 = result["theta3"]

    # Coupler point
    alpha_rad = np.radians(mech.alpha)
    px = B[0] + mech.p * np.cos(theta3 + alpha_rad)
    py = B[1] + mech.p * np.sin(theta3 + alpha_rad)

    return {
        "joints": [
            {"name": "J1", "x": A[0], "y": A[1], "type": "revolute", "isFixed": True},
            {"name": "J2", "x": B[0], "y": B[1], "type": "revolute", "isFixed": False},
            {"name": "J3", "x": C[0], "y": C[1], "type": "prismatic", "isFixed": False},
        ],
        "links": [
            {"start": A, "end": B, "name": "L2", "isGround": False, "isCoupler": False},
            {"start": B, "end": C, "name": "L3", "isGround": False, "isCoupler": True},
        ],
        "couplerPoint": {"x": float(px), "y": float(py)},
        "angles": {
            "theta2": float(np.degrees(result["theta2"])),
            "theta3": float(np.degrees(result["theta3"])),
        },
        "sliderPos": result["slider_pos"],
    }


def forward_kinematics(
    mechanism,
    theta2_deg: float,
    branch: int = 0,
) -> Optional[Dict]:
    """
    Dispatch forward kinematics to the appropriate solver based on mechanism type.
    """
    if isinstance(mechanism, FourBar):
        return forward_kinematics_four_bar(mechanism, theta2_deg, branch)
    elif isinstance(mechanism, SliderCrank):
        return forward_kinematics_slider_crank(mechanism, theta2_deg, branch)
    elif isinstance(mechanism, (SixBarWatt, SixBarStephenson)):
        # Simplified: use base 4-bar FK for now
        base = FourBar(
            a1=mechanism.a1, a2=mechanism.a2, a3=mechanism.a3, a4=mechanism.a4,
            p=mechanism.p, alpha=mechanism.alpha,
            pivot_a=mechanism.pivot_a, pivot_d=mechanism.pivot_d,
        )
        return forward_kinematics_four_bar(base, theta2_deg, branch)
    else:
        raise ValueError(f"Unknown mechanism type: {type(mechanism)}")
