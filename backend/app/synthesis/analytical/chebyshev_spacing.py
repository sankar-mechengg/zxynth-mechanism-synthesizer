"""
Chebyshev Spacing

Computes optimal precision point locations using Chebyshev nodes.
These minimize the maximum structural error (deviation between
desired and actual output at non-precision positions).

Formula:
  x_k = (a + b)/2 + (b - a)/2 · cos((2k - 1)π / 2n)
  for k = 1, ..., n

Where [a, b] is the input range and n is the number of precision points.

Chebyshev nodes cluster near the endpoints of the interval,
which counteracts the Runge phenomenon (oscillation at boundaries)
that occurs with uniformly spaced points.
"""

import numpy as np
from typing import List, Tuple


def chebyshev_nodes(a: float, b: float, n: int) -> np.ndarray:
    """
    Compute n Chebyshev nodes in the interval [a, b].

    Args:
        a: interval start
        b: interval end
        n: number of nodes

    Returns:
        array of n node positions, ordered from near-b to near-a
    """
    if n < 1:
        return np.array([])
    if n == 1:
        return np.array([(a + b) / 2])

    k = np.arange(1, n + 1)
    nodes = (a + b) / 2 + (b - a) / 2 * np.cos((2 * k - 1) * np.pi / (2 * n))

    # Sort ascending
    return np.sort(nodes)


def chebyshev_angles(
    theta_start: float,
    theta_end: float,
    n: int,
) -> np.ndarray:
    """
    Compute Chebyshev-spaced crank angles for precision points.

    Args:
        theta_start: start angle in degrees
        theta_end: end angle in degrees
        n: number of precision points

    Returns:
        array of n angles in degrees
    """
    return chebyshev_nodes(theta_start, theta_end, n)


def chebyshev_indices(n_total: int, n_select: int) -> List[int]:
    """
    Compute Chebyshev-spaced indices for selecting points from an array.

    Args:
        n_total: total number of points in the array
        n_select: number of points to select

    Returns:
        list of indices (0-based)
    """
    if n_select >= n_total:
        return list(range(n_total))

    # Map Chebyshev nodes from [0, n_total-1]
    nodes = chebyshev_nodes(0, n_total - 1, n_select)
    indices = [int(round(x)) for x in nodes]

    # Ensure unique and in range
    indices = sorted(set(max(0, min(n_total - 1, idx)) for idx in indices))

    # If we lost some due to rounding, add uniformly spaced extras
    while len(indices) < n_select:
        for i in range(n_total):
            if i not in indices:
                indices.append(i)
                indices.sort()
                if len(indices) >= n_select:
                    break

    return indices[:n_select]


def chebyshev_function_pairs(
    theta_in_start: float,
    theta_in_end: float,
    theta_out_func,
    n: int,
) -> List[Tuple[float, float]]:
    """
    Generate Chebyshev-spaced (θ_in, θ_out) precision pairs for function generation.

    Args:
        theta_in_start: start of input range (degrees)
        theta_in_end: end of input range (degrees)
        theta_out_func: callable that maps θ_in → θ_out
        n: number of precision pairs

    Returns:
        list of (θ_in, θ_out) tuples in degrees
    """
    angles = chebyshev_angles(theta_in_start, theta_in_end, n)
    pairs = [(float(a), float(theta_out_func(a))) for a in angles]
    return pairs


def uniform_spacing(a: float, b: float, n: int) -> np.ndarray:
    """
    Compute uniformly spaced points (for comparison with Chebyshev).

    This is the naive approach — Chebyshev spacing is almost always better
    for minimizing maximum structural error.
    """
    return np.linspace(a, b, n)


def structural_error_bound(
    interval_length: float,
    n_precision: int,
    max_derivative: float = 1.0,
) -> float:
    """
    Estimate the maximum structural error for Chebyshev vs uniform spacing.

    For Chebyshev spacing, the error bound is:
      E ≤ M / (2^(n-1) · n!) · ((b-a)/2)^n

    where M is the bound on the nth derivative of the function.
    This is typically much smaller than uniform spacing.

    Returns approximate error bound (dimensionless).
    """
    h = interval_length / 2
    factorial_n = float(np.math.factorial(n_precision))
    power_term = h ** n_precision

    chebyshev_bound = max_derivative * power_term / (2 ** (n_precision - 1) * factorial_n)

    return float(chebyshev_bound)
