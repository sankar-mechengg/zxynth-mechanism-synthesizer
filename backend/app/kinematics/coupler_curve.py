"""
Coupler Curve Generator

Generates the complete coupler curve by sweeping the input crank
through its full range and recording the coupler point position.
"""

import numpy as np
from typing import Optional, List, Tuple

from .loop_closure import solve_four_bar, solve_slider_crank
from ..models.mechanism import FourBar, SliderCrank


def generate_coupler_curve_four_bar(
    mech: FourBar,
    n_points: int = 360,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
    branch: int = 0,
) -> np.ndarray:
    """
    Generate the coupler curve for a 4-bar linkage.

    Args:
        mech: FourBar mechanism parameters
        n_points: number of sample points
        theta_start, theta_end: crank angle range in degrees
        branch: assembly branch (0 or 1)

    Returns:
        (M, 2) array of coupler point [x, y] positions.
        M may be less than n_points if some angles are infeasible.
    """
    points = []
    alpha_rad = np.radians(mech.alpha)

    for i in range(n_points):
        theta2_deg = theta_start + (theta_end - theta_start) * i / max(1, n_points - 1)
        theta2 = np.radians(theta2_deg)

        result = solve_four_bar(
            mech.a1, mech.a2, mech.a3, mech.a4,
            theta2,
            pivot_a=mech.pivot_a,
            pivot_d=mech.pivot_d,
            branch=branch,
        )

        if result is not None:
            bx, by = result["B"]
            theta3 = result["theta3"]

            px = bx + mech.p * np.cos(theta3 + alpha_rad)
            py = by + mech.p * np.sin(theta3 + alpha_rad)
            points.append([px, py])

    if len(points) == 0:
        return np.empty((0, 2))

    return np.array(points)


def generate_coupler_curve_slider_crank(
    mech: SliderCrank,
    n_points: int = 360,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
    branch: int = 0,
) -> np.ndarray:
    """Generate coupler curve for a slider-crank mechanism."""
    points = []
    alpha_rad = np.radians(mech.alpha)

    for i in range(n_points):
        theta2_deg = theta_start + (theta_end - theta_start) * i / max(1, n_points - 1)
        theta2 = np.radians(theta2_deg)

        result = solve_slider_crank(
            mech.a2, mech.a3, theta2,
            offset=mech.offset,
            pivot_a=mech.pivot_a,
            slider_angle=np.radians(mech.slider_angle),
            branch=branch,
        )

        if result is not None:
            bx, by = result["B"]
            theta3 = result["theta3"]

            px = bx + mech.p * np.cos(theta3 + alpha_rad)
            py = by + mech.p * np.sin(theta3 + alpha_rad)
            points.append([px, py])

    if len(points) == 0:
        return np.empty((0, 2))

    return np.array(points)


def generate_coupler_curve(
    mechanism,
    n_points: int = 360,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
    branch: int = 0,
) -> np.ndarray:
    """Dispatch to appropriate curve generator."""
    if isinstance(mechanism, FourBar):
        return generate_coupler_curve_four_bar(
            mechanism, n_points, theta_start, theta_end, branch
        )
    elif isinstance(mechanism, SliderCrank):
        return generate_coupler_curve_slider_crank(
            mechanism, n_points, theta_start, theta_end, branch
        )
    else:
        # For 6-bar, generate base 4-bar curve (simplified)
        base = FourBar(
            a1=mechanism.a1, a2=mechanism.a2,
            a3=mechanism.a3, a4=mechanism.a4,
            p=mechanism.p, alpha=mechanism.alpha,
            pivot_a=mechanism.pivot_a, pivot_d=mechanism.pivot_d,
        )
        return generate_coupler_curve_four_bar(
            base, n_points, theta_start, theta_end, branch
        )


def generate_function_output(
    mech: FourBar,
    n_points: int = 101,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
    branch: int = 0,
) -> np.ndarray:
    """
    Generate (theta_in, theta_out) pairs for function generation evaluation.

    Returns:
        (M, 2) array of [theta2_deg, theta4_deg]
    """
    pairs = []

    for i in range(n_points):
        theta2_deg = theta_start + (theta_end - theta_start) * i / max(1, n_points - 1)
        theta2 = np.radians(theta2_deg)

        result = solve_four_bar(
            mech.a1, mech.a2, mech.a3, mech.a4,
            theta2,
            pivot_a=mech.pivot_a,
            pivot_d=mech.pivot_d,
            branch=branch,
        )

        if result is not None:
            theta4_deg = np.degrees(result["theta4"])
            pairs.append([theta2_deg, theta4_deg])

    if len(pairs) == 0:
        return np.empty((0, 2))

    return np.array(pairs)
