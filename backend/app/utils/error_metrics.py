"""
Error metrics for comparing desired path vs actual coupler curve.
"""

import numpy as np
from typing import Dict
from .curve_utils import closest_point_distances, curve_extent


def compute_error_metrics(
    desired: np.ndarray,
    actual: np.ndarray,
) -> Dict[str, float]:
    """
    Compute error metrics between desired path and actual coupler curve.
    Uses the closest-point error metric: for each desired point, find the
    minimum distance to any point on the actual curve.

    Args:
        desired: (N, 2) desired path points
        actual: (M, 2) actual coupler curve points

    Returns:
        dict with mean, max, rms errors (absolute and as percentage of curve extent)
    """
    if len(desired) < 2 or len(actual) < 2:
        return {
            "mean": float("inf"),
            "max": float("inf"),
            "rms": float("inf"),
            "meanPercent": 100.0,
            "maxPercent": 100.0,
            "rmsPercent": 100.0,
        }

    # Compute closest-point distances
    distances = closest_point_distances(desired, actual)

    # Absolute metrics
    mean_error = float(np.mean(distances))
    max_error = float(np.max(distances))
    rms_error = float(np.sqrt(np.mean(distances**2)))

    # Normalize by curve extent
    extent = curve_extent(desired)
    if extent > 0:
        mean_pct = (mean_error / extent) * 100
        max_pct = (max_error / extent) * 100
        rms_pct = (rms_error / extent) * 100
    else:
        mean_pct = max_pct = rms_pct = 100.0

    return {
        "mean": round(mean_error, 6),
        "max": round(max_error, 6),
        "rms": round(rms_error, 6),
        "meanPercent": round(mean_pct, 4),
        "maxPercent": round(max_pct, 4),
        "rmsPercent": round(rms_pct, 4),
    }


def compute_function_error(
    desired_pairs: np.ndarray,
    actual_pairs: np.ndarray,
) -> Dict[str, float]:
    """
    Compute error metrics for function generation.
    Compares θ_out values at matching θ_in positions.

    Args:
        desired_pairs: (N, 2) array of [theta_in, theta_out_desired]
        actual_pairs: (N, 2) array of [theta_in, theta_out_actual]

    Returns:
        dict with mean, max, rms angular errors in degrees
    """
    if len(desired_pairs) != len(actual_pairs):
        raise ValueError("Desired and actual must have same number of pairs")

    errors = np.abs(desired_pairs[:, 1] - actual_pairs[:, 1])

    mean_error = float(np.mean(errors))
    max_error = float(np.max(errors))
    rms_error = float(np.sqrt(np.mean(errors**2)))

    # Normalize by output range
    out_range = float(np.max(desired_pairs[:, 1]) - np.min(desired_pairs[:, 1]))
    if out_range > 0:
        mean_pct = (mean_error / out_range) * 100
        max_pct = (max_error / out_range) * 100
        rms_pct = (rms_error / out_range) * 100
    else:
        mean_pct = max_pct = rms_pct = 100.0

    return {
        "mean": round(mean_error, 6),
        "max": round(max_error, 6),
        "rms": round(rms_error, 6),
        "meanPercent": round(mean_pct, 4),
        "maxPercent": round(max_pct, 4),
        "rmsPercent": round(rms_pct, 4),
    }


def compute_motion_error(
    desired_poses: np.ndarray,
    actual_poses: np.ndarray,
    position_weight: float = 1.0,
    angle_weight: float = 0.01,
) -> Dict[str, float]:
    """
    Compute error for motion generation.
    Combines positional error and angular error.

    Args:
        desired_poses: (N, 3) array of [x, y, theta_deg]
        actual_poses: (N, 3) array of [x, y, theta_deg]
        position_weight: weight for position error
        angle_weight: weight for angular error (deg → comparable scale)

    Returns:
        dict with combined, position-only, and angle-only errors
    """
    pos_errors = np.sqrt(np.sum((desired_poses[:, :2] - actual_poses[:, :2])**2, axis=1))
    ang_errors = np.abs(desired_poses[:, 2] - actual_poses[:, 2])

    # Wrap angular errors to [0, 180]
    ang_errors = np.minimum(ang_errors, 360 - ang_errors)

    combined = position_weight * pos_errors + angle_weight * ang_errors

    extent = curve_extent(desired_poses[:, :2])
    norm = extent if extent > 0 else 1.0

    return {
        "mean": round(float(np.mean(combined)), 6),
        "max": round(float(np.max(combined)), 6),
        "rms": round(float(np.sqrt(np.mean(combined**2))), 6),
        "meanPercent": round(float(np.mean(pos_errors) / norm * 100), 4),
        "maxPercent": round(float(np.max(pos_errors) / norm * 100), 4),
        "rmsPercent": round(float(np.sqrt(np.mean(pos_errors**2)) / norm * 100), 4),
        "meanAngleError": round(float(np.mean(ang_errors)), 4),
        "maxAngleError": round(float(np.max(ang_errors)), 4),
    }
