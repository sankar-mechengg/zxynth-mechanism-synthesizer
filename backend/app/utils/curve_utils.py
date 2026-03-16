"""
Curve manipulation utilities.
Resampling, normalization, smoothing, coordinate transforms for path data.
"""

import numpy as np
from typing import List, Tuple, Optional


def resample_uniform(points: np.ndarray, n: int) -> np.ndarray:
    """
    Resample a polyline to n points with uniform arc-length spacing.

    Args:
        points: (M, 2) array of [x, y] points
        n: desired number of output points

    Returns:
        (n, 2) array of uniformly spaced points
    """
    if len(points) < 2 or n < 2:
        return points.copy()

    # Cumulative arc length
    diffs = np.diff(points, axis=0)
    seg_lengths = np.sqrt(np.sum(diffs**2, axis=1))
    cum_lengths = np.concatenate([[0], np.cumsum(seg_lengths)])
    total_length = cum_lengths[-1]

    if total_length == 0:
        return np.tile(points[0], (n, 1))

    # Target arc lengths
    targets = np.linspace(0, total_length, n)

    # Interpolate
    result = np.zeros((n, 2))
    j = 0
    for i, target in enumerate(targets):
        while j < len(cum_lengths) - 2 and cum_lengths[j + 1] < target:
            j += 1
        seg_len = cum_lengths[j + 1] - cum_lengths[j]
        frac = (target - cum_lengths[j]) / seg_len if seg_len > 0 else 0
        result[i] = points[j] + frac * (points[j + 1] - points[j])

    return result


def normalize_to_range(points: np.ndarray, target_size: float = 100.0) -> Tuple[np.ndarray, float]:
    """
    Normalize points to fit within [0, target_size], preserving aspect ratio.

    Returns:
        (normalized_points, scale_factor)
    """
    if len(points) == 0:
        return points, 1.0

    mins = np.min(points, axis=0)
    maxs = np.max(points, axis=0)
    ranges = maxs - mins
    max_range = np.max(ranges)

    if max_range == 0:
        return points - mins, 1.0

    scale = target_size / max_range
    normalized = (points - mins) * scale

    return normalized, float(scale)


def shift_to_origin(points: np.ndarray) -> np.ndarray:
    """Shift points so the first point is at (0, 0)."""
    if len(points) == 0:
        return points
    return points - points[0]


def flip_y(points: np.ndarray) -> np.ndarray:
    """Flip Y axis (SVG Y-down → math Y-up)."""
    if len(points) == 0:
        return points
    result = points.copy()
    max_y = np.max(result[:, 1])
    result[:, 1] = max_y - result[:, 1]
    return result


def svg_to_mechanism_coords(points: np.ndarray) -> np.ndarray:
    """Convert SVG coordinates to mechanism space (flip Y, shift to origin)."""
    flipped = flip_y(points)
    shifted = shift_to_origin(flipped)
    return shifted


def smooth_path(points: np.ndarray, window: int = 5) -> np.ndarray:
    """
    Smooth a path using moving average filter.
    Preserves start and end points exactly.
    """
    if len(points) < window or window < 3:
        return points.copy()

    result = points.copy()
    half = window // 2

    for i in range(half, len(points) - half):
        result[i] = np.mean(points[i - half:i + half + 1], axis=0)

    return result


def arc_length(points: np.ndarray) -> float:
    """Total arc length of a polyline."""
    if len(points) < 2:
        return 0.0
    diffs = np.diff(points, axis=0)
    return float(np.sum(np.sqrt(np.sum(diffs**2, axis=1))))


def curve_extent(points: np.ndarray) -> float:
    """Maximum extent (diagonal of bounding box) of a point set."""
    if len(points) < 2:
        return 0.0
    mins = np.min(points, axis=0)
    maxs = np.max(points, axis=0)
    ranges = maxs - mins
    return float(np.sqrt(np.sum(ranges**2)))


def subsample_chebyshev(points: np.ndarray, n: int) -> np.ndarray:
    """
    Select n points from the array at Chebyshev-spaced indices.
    Optimal for minimizing maximum structural error in precision-point methods.

    Chebyshev nodes: x_k = (a+b)/2 + (b-a)/2 * cos((2k-1)π / 2n), k=1..n
    """
    if n >= len(points):
        return points.copy()

    N = len(points)
    indices = []
    for k in range(1, n + 1):
        # Map Chebyshev node from [-1,1] to [0, N-1]
        x = np.cos((2 * k - 1) * np.pi / (2 * n))
        idx = int(round((x + 1) / 2 * (N - 1)))
        idx = max(0, min(N - 1, idx))
        indices.append(idx)

    # Remove duplicates while preserving order
    seen = set()
    unique_indices = []
    for idx in sorted(indices):
        if idx not in seen:
            seen.add(idx)
            unique_indices.append(idx)

    return points[unique_indices]


def closest_point_distances(desired: np.ndarray, actual: np.ndarray) -> np.ndarray:
    """
    For each point in 'desired', find the distance to the closest point in 'actual'.
    Uses broadcasting for efficiency.

    Args:
        desired: (N, 2) desired path points
        actual: (M, 2) actual coupler curve points

    Returns:
        (N,) array of minimum distances
    """
    # desired: (N, 1, 2), actual: (1, M, 2)
    diff = desired[:, np.newaxis, :] - actual[np.newaxis, :, :]
    dist_sq = np.sum(diff**2, axis=2)  # (N, M)
    min_dist_sq = np.min(dist_sq, axis=1)  # (N,)
    return np.sqrt(min_dist_sq)
