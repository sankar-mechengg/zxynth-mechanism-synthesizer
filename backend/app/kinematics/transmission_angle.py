"""
Transmission Angle Calculator

The transmission angle μ is the angle between the coupler (link 3)
and the output link (link 4) at their shared joint C.

Formula:
  cos(μ) = (a3² + a4² - a1² - a2² + 2·a1·a2·cos(θ₂)) / (2·a3·a4)

Good designs keep μ_min ≥ 40° throughout the cycle.
"""

import numpy as np
from typing import Dict


def compute_transmission_angle(
    a1: float, a2: float, a3: float, a4: float,
    theta2: float,
) -> float:
    """
    Compute transmission angle at a specific crank angle.

    Args:
        a1-a4: link lengths
        theta2: crank angle in radians

    Returns:
        transmission angle μ in degrees [0, 180]
    """
    numerator = a3**2 + a4**2 - a1**2 - a2**2 + 2 * a1 * a2 * np.cos(theta2)
    denominator = 2 * a3 * a4

    if abs(denominator) < 1e-12:
        return 0.0

    cos_mu = numerator / denominator
    cos_mu = np.clip(cos_mu, -1.0, 1.0)

    mu = np.degrees(np.arccos(cos_mu))
    return float(mu)


def compute_transmission_angle_range(
    a1: float, a2: float, a3: float, a4: float,
    n_samples: int = 360,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
) -> Dict:
    """
    Compute min and max transmission angle over the crank range.

    Returns:
        dict with 'min', 'max', 'minAngle' (crank angle at min μ),
        'maxAngle' (crank angle at max μ), 'profile' (list of {angle, mu})
    """
    angles = np.linspace(np.radians(theta_start), np.radians(theta_end), n_samples)
    mus = np.array([compute_transmission_angle(a1, a2, a3, a4, t) for t in angles])

    # Filter out zero angles (infeasible positions)
    valid_mask = mus > 0
    if not np.any(valid_mask):
        return {
            "min": 0.0,
            "max": 0.0,
            "minAngle": 0.0,
            "maxAngle": 0.0,
        }

    valid_mus = mus[valid_mask]
    valid_angles = np.degrees(angles[valid_mask])

    min_idx = np.argmin(valid_mus)
    max_idx = np.argmax(valid_mus)

    return {
        "min": round(float(valid_mus[min_idx]), 2),
        "max": round(float(valid_mus[max_idx]), 2),
        "minAngle": round(float(valid_angles[min_idx]), 2),
        "maxAngle": round(float(valid_angles[max_idx]), 2),
    }


def transmission_angle_penalty(
    a1: float, a2: float, a3: float, a4: float,
    min_allowed: float = 40.0,
    n_samples: int = 72,
) -> float:
    """
    Compute penalty for transmission angle constraint violation.
    Returns 0 if min transmission angle ≥ min_allowed.

    Used during optimization to penalize mechanisms with poor
    force transmission characteristics.
    """
    # Check at critical angles first (0° and 180° are where extremes typically occur)
    critical_angles = [0, np.pi]

    # Also sample more densely
    sample_angles = np.linspace(0, 2 * np.pi, n_samples, endpoint=False)
    all_angles = np.concatenate([critical_angles, sample_angles])

    min_mu = 180.0
    for theta2 in all_angles:
        mu = compute_transmission_angle(a1, a2, a3, a4, theta2)
        if 0 < mu < min_mu:
            min_mu = mu

    if min_mu >= min_allowed:
        return 0.0

    # Quadratic penalty
    violation = min_allowed - min_mu
    return violation ** 2
