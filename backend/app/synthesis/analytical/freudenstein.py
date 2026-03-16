"""
Freudenstein Equation Solver

The foundational analytical method for function generation.
Given 3 precision pairs (θ₂, θ₄), solves for link length ratios.

Freudenstein's equation:
  R₁·cos(θ₂) − R₂·cos(θ₄) + R₃ = cos(θ₂ − θ₄)

Where:
  R₁ = a₁/a₄    (ground / rocker)
  R₂ = a₁/a₂    (ground / crank)
  R₃ = (a₁² + a₂² + a₄² − a₃²) / (2·a₂·a₄)
"""

import numpy as np
from typing import Dict, Optional, List, Tuple

from ...models.mechanism import FourBar


def solve_freudenstein_3point(
    precision_pairs: List[Tuple[float, float]],
    a1: float = 1.0,
) -> Optional[Dict]:
    """
    Solve Freudenstein's equation for 3 precision points.

    Args:
        precision_pairs: list of 3 (θ₂, θ₄) pairs in degrees
        a1: assumed ground link length (scale factor)

    Returns:
        dict with mechanism parameters, Freudenstein constants, and solution details
    """
    if len(precision_pairs) != 3:
        raise ValueError(f"Freudenstein 3-point requires exactly 3 pairs, got {len(precision_pairs)}")

    # Convert to radians
    pairs_rad = [(np.radians(t2), np.radians(t4)) for t2, t4 in precision_pairs]

    # Build 3×3 linear system: A · [R1, R2, R3]ᵀ = b
    A = np.zeros((3, 3))
    b = np.zeros(3)

    for i, (t2, t4) in enumerate(pairs_rad):
        A[i, 0] = np.cos(t2)      # R1 coefficient
        A[i, 1] = -np.cos(t4)     # R2 coefficient
        A[i, 2] = 1.0             # R3 coefficient
        b[i] = np.cos(t2 - t4)    # RHS

    # Solve
    det = np.linalg.det(A)
    if abs(det) < 1e-12:
        return None  # Singular system — precision points are degenerate

    R = np.linalg.solve(A, b)
    R1, R2, R3 = R

    # Back-substitute to find link lengths
    # R1 = a1/a4  →  a4 = a1/R1
    # R2 = a1/a2  →  a2 = a1/R2
    # R3 = (a1² + a2² + a4² - a3²) / (2·a2·a4)
    #   →  a3² = a1² + a2² + a4² - 2·a2·a4·R3

    if abs(R1) < 1e-12 or abs(R2) < 1e-12:
        return None  # Would give infinite link length

    a4 = a1 / R1
    a2 = a1 / R2

    a3_sq = a1**2 + a2**2 + a4**2 - 2 * a2 * a4 * R3
    if a3_sq < 0:
        return None  # Negative → physically impossible

    a3 = np.sqrt(a3_sq)

    # Validate: all lengths must be positive
    if any(l <= 0 for l in [a1, a2, a3, a4]):
        return None

    mechanism = FourBar(
        a1=abs(a1), a2=abs(a2), a3=abs(a3), a4=abs(a4),
        pivot_a=(0, 0),
        pivot_d=(abs(a1), 0),
    )

    return {
        "mechanism": mechanism,
        "freudenstein_constants": {
            "R1": float(R1),
            "R2": float(R2),
            "R3": float(R3),
        },
        "precision_pairs": precision_pairs,
        "system_matrix": A.tolist(),
        "system_det": float(det),
        "method": "Freudenstein 3-point",
    }


def solve_freudenstein_least_squares(
    pairs: List[Tuple[float, float]],
    a1: float = 1.0,
) -> Optional[Dict]:
    """
    Solve Freudenstein's equation for N > 3 precision points using least squares.

    This finds the best R1, R2, R3 that minimize the sum of squared residuals
    of Freudenstein's equation across all given pairs.

    Args:
        pairs: list of N (θ₂, θ₄) pairs in degrees (N ≥ 3)
        a1: assumed ground link length

    Returns:
        dict with mechanism parameters and residual info
    """
    n = len(pairs)
    if n < 3:
        raise ValueError(f"Need at least 3 pairs, got {n}")

    if n == 3:
        return solve_freudenstein_3point(pairs, a1)

    pairs_rad = [(np.radians(t2), np.radians(t4)) for t2, t4 in pairs]

    # Over-determined system: A · R = b (N × 3, N > 3)
    A = np.zeros((n, 3))
    b = np.zeros(n)

    for i, (t2, t4) in enumerate(pairs_rad):
        A[i, 0] = np.cos(t2)
        A[i, 1] = -np.cos(t4)
        A[i, 2] = 1.0
        b[i] = np.cos(t2 - t4)

    # Least squares solution
    R, residuals, rank, sv = np.linalg.lstsq(A, b, rcond=None)
    R1, R2, R3 = R

    if abs(R1) < 1e-12 or abs(R2) < 1e-12:
        return None

    a4 = a1 / R1
    a2 = a1 / R2
    a3_sq = a1**2 + a2**2 + a4**2 - 2 * a2 * a4 * R3

    if a3_sq < 0:
        return None

    a3 = np.sqrt(a3_sq)

    if any(l <= 0 for l in [a1, a2, a3, a4]):
        return None

    mechanism = FourBar(
        a1=abs(a1), a2=abs(a2), a3=abs(a3), a4=abs(a4),
        pivot_a=(0, 0),
        pivot_d=(abs(a1), 0),
    )

    residual_total = float(np.sum((A @ R - b)**2))

    return {
        "mechanism": mechanism,
        "freudenstein_constants": {
            "R1": float(R1), "R2": float(R2), "R3": float(R3),
        },
        "precision_pairs": pairs,
        "residual": residual_total,
        "method": f"Freudenstein least-squares ({n} points)",
    }
