"""
Loop-Closure Equation Solver

Solves the vector loop equation for planar mechanisms:
  r₂ + r₃ = r₁ + r₄  (4-bar)

Given θ₂ (input crank angle) and link lengths, finds θ₃ and θ₄.
Uses the circle-circle intersection approach for robustness.
"""

import numpy as np
from typing import Optional, Tuple, Dict

from ..utils.geometry import circle_circle_intersection


def solve_four_bar(
    a1: float, a2: float, a3: float, a4: float,
    theta2: float,
    pivot_a: Tuple[float, float] = (0.0, 0.0),
    pivot_d: Tuple[float, float] = None,
    ground_angle: float = 0.0,
    branch: int = 0,
) -> Optional[Dict]:
    """
    Solve 4-bar loop closure for given input angle θ₂.

    Args:
        a1-a4: link lengths (ground, crank, coupler, rocker)
        theta2: input crank angle in radians
        pivot_a: ground pivot A position (x, y)
        pivot_d: ground pivot D position (x, y) — if None, computed from a1 + ground_angle
        ground_angle: angle of ground link in radians (used if pivot_d is None)
        branch: 0 = "open" assembly, 1 = "crossed" assembly

    Returns:
        dict with joint positions {A, B, C, D}, angles {theta3, theta4}, or None if infeasible
    """
    ax, ay = pivot_a

    if pivot_d is None:
        dx = ax + a1 * np.cos(ground_angle)
        dy = ay + a1 * np.sin(ground_angle)
    else:
        dx, dy = pivot_d

    # Joint B: end of crank (link 2)
    bx = ax + a2 * np.cos(theta2)
    by = ay + a2 * np.sin(theta2)

    # Joint C: intersection of circle centered at B (radius a3) and
    #          circle centered at D (radius a4)
    result = circle_circle_intersection(bx, by, a3, dx, dy, a4)
    if result is None:
        return None  # Cannot assemble at this angle

    # Pick assembly branch
    c1, c2 = result
    if branch == 0:
        cx, cy = c1
    else:
        cx, cy = c2

    # Compute angles
    theta3 = np.arctan2(cy - by, cx - bx)
    theta4 = np.arctan2(cy - dy, cx - dx)
    theta1 = np.arctan2(dy - ay, dx - ax)

    return {
        "A": (ax, ay),
        "B": (bx, by),
        "C": (cx, cy),
        "D": (dx, dy),
        "theta1": float(theta1),
        "theta2": float(theta2),
        "theta3": float(theta3),
        "theta4": float(theta4),
    }


def solve_slider_crank(
    a2: float, a3: float,
    theta2: float,
    offset: float = 0.0,
    pivot_a: Tuple[float, float] = (0.0, 0.0),
    slider_angle: float = 0.0,
    branch: int = 0,
) -> Optional[Dict]:
    """
    Solve slider-crank loop closure.

    The slider moves along a line at slider_angle, offset from pivot_a.

    Returns:
        dict with joint positions {A, B, C_slider}, angles {theta3}, slider position d
    """
    ax, ay = pivot_a

    # Joint B: end of crank
    bx = ax + a2 * np.cos(theta2)
    by = ay + a2 * np.sin(theta2)

    # Slider axis direction
    cos_s = np.cos(slider_angle)
    sin_s = np.sin(slider_angle)

    # The slider point C lies on the line: (ax + t*cos_s, ay + offset*(-sin_s) + t*sin_s)
    # Distance from B to C must equal a3
    # Solve: (bx - ax - t*cos_s)² + (by - ay - offset*cos_s_perp - t*sin_s)² = a3²

    # Simplified for horizontal slider (slider_angle=0, offset from x-axis):
    # C = (cx, ay + offset)
    # (bx - cx)² + (by - ay - offset)² = a3²

    sy = ay + offset  # slider y-coordinate (for horizontal slider)
    dy_b = by - sy

    if abs(dy_b) > a3:
        return None  # Cannot reach slider line

    # cx solutions
    dx_sq = a3**2 - dy_b**2
    if dx_sq < 0:
        return None
    dx = np.sqrt(dx_sq)

    cx1 = bx + dx
    cx2 = bx - dx

    cx = cx1 if branch == 0 else cx2

    theta3 = np.arctan2(sy - by, cx - bx)

    return {
        "A": (ax, ay),
        "B": (bx, by),
        "C": (cx, sy),
        "theta2": float(theta2),
        "theta3": float(theta3),
        "slider_pos": float(cx - ax),
    }


def solve_six_bar_watt(
    a1: float, a2: float, a3: float, a4: float,
    a5: float, a6: float,
    theta2: float,
    pivot_a: Tuple[float, float] = (0.0, 0.0),
    pivot_d: Tuple[float, float] = None,
    pivot_e: Tuple[float, float] = None,
    ground_angle: float = 0.0,
    dyad_angle: float = 0.0,
    dyad_offset: float = 0.0,
    branch_main: int = 0,
    branch_dyad: int = 0,
) -> Optional[Dict]:
    """
    Solve 6-bar Watt-I loop closure.
    First solves the base 4-bar (links 1-4), then the appended dyad (links 5-6).

    In Watt-I, the ternary link (say link 3) has an extra point E on it,
    and links 5-6 connect E to ground pivot F.
    """
    # Solve base 4-bar
    base = solve_four_bar(a1, a2, a3, a4, theta2, pivot_a, pivot_d, ground_angle, branch_main)
    if base is None:
        return None

    bx, by = base["B"]
    cx, cy = base["C"]

    # Point E on the coupler (ternary link 3)
    # E is at distance dyad_offset from B, at angle theta3 + dyad_angle
    theta3 = base["theta3"]
    ex = bx + dyad_offset * np.cos(theta3 + np.radians(dyad_angle))
    ey = by + dyad_offset * np.sin(theta3 + np.radians(dyad_angle))

    if pivot_e is None:
        return None

    fx, fy = pivot_e  # Third ground pivot

    # Solve dyad: circle at E (radius a5) intersects circle at F (radius a6)
    dyad_result = circle_circle_intersection(ex, ey, a5, fx, fy, a6)
    if dyad_result is None:
        return None

    g1, g2 = dyad_result
    gx, gy = g1 if branch_dyad == 0 else g2

    theta5 = np.arctan2(gy - ey, gx - ex)
    theta6 = np.arctan2(gy - fy, gx - fx)

    return {
        **base,
        "E": (ex, ey),
        "F": (fx, fy),
        "G": (gx, gy),
        "theta5": float(theta5),
        "theta6": float(theta6),
    }


def check_assemblability(
    a1: float, a2: float, a3: float, a4: float,
    n_samples: int = 360,
) -> Dict:
    """
    Check if a 4-bar can assemble over a full 360° crank rotation.

    Returns:
        dict with 'full_rotation' (bool), 'feasible_range' (min_angle, max_angle),
        'num_feasible' (count)
    """
    feasible_angles = []

    for i in range(n_samples):
        theta2 = 2 * np.pi * i / n_samples
        result = solve_four_bar(a1, a2, a3, a4, theta2)
        if result is not None:
            feasible_angles.append(theta2)

    return {
        "full_rotation": len(feasible_angles) == n_samples,
        "num_feasible": len(feasible_angles),
        "fraction_feasible": len(feasible_angles) / n_samples,
        "feasible_range": (
            float(min(feasible_angles)) if feasible_angles else 0,
            float(max(feasible_angles)) if feasible_angles else 0,
        ),
    }
