"""
Geometry helper functions for mechanism computations.
"""

import numpy as np
from typing import Tuple, Optional


def distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Euclidean distance between two points."""
    return np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)


def distance_sq(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Squared Euclidean distance (avoids sqrt for comparisons)."""
    return (p2[0] - p1[0])**2 + (p2[1] - p1[1])**2


def normalize_angle(angle_rad: float) -> float:
    """Normalize angle to [-π, π]."""
    while angle_rad > np.pi:
        angle_rad -= 2 * np.pi
    while angle_rad < -np.pi:
        angle_rad += 2 * np.pi
    return angle_rad


def normalize_angle_deg(angle_deg: float) -> float:
    """Normalize angle to [0, 360)."""
    return angle_deg % 360.0


def deg_to_rad(deg: float) -> float:
    return deg * np.pi / 180.0


def rad_to_deg(rad: float) -> float:
    return rad * 180.0 / np.pi


def rotate_point(
    x: float, y: float,
    angle_rad: float,
    cx: float = 0.0, cy: float = 0.0,
) -> Tuple[float, float]:
    """Rotate point (x, y) around center (cx, cy) by angle_rad."""
    dx, dy = x - cx, y - cy
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    return (
        cx + dx * cos_a - dy * sin_a,
        cy + dx * sin_a + dy * cos_a,
    )


def rotate_points(
    points: np.ndarray,
    angle_rad: float,
    cx: float = 0.0, cy: float = 0.0,
) -> np.ndarray:
    """Rotate array of points [[x,y],...] around center."""
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    centered = points - np.array([cx, cy])
    rot = np.array([[cos_a, -sin_a], [sin_a, cos_a]])
    rotated = centered @ rot.T
    return rotated + np.array([cx, cy])


def line_intersection(
    p1: Tuple[float, float], p2: Tuple[float, float],
    p3: Tuple[float, float], p4: Tuple[float, float],
) -> Optional[Tuple[float, float]]:
    """
    Find intersection of lines p1-p2 and p3-p4.
    Returns None if lines are parallel.
    """
    x1, y1 = p1; x2, y2 = p2
    x3, y3 = p3; x4, y4 = p4

    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-12:
        return None

    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    return (
        x1 + t * (x2 - x1),
        y1 + t * (y2 - y1),
    )


def circle_circle_intersection(
    cx1: float, cy1: float, r1: float,
    cx2: float, cy2: float, r2: float,
) -> Optional[Tuple[Tuple[float, float], Tuple[float, float]]]:
    """
    Find the two intersection points of two circles.
    Returns ((x1,y1), (x2,y2)) or None if no intersection.
    """
    dx = cx2 - cx1
    dy = cy2 - cy1
    d = np.sqrt(dx*dx + dy*dy)

    if d > r1 + r2 or d < abs(r1 - r2) or d == 0:
        return None

    a = (r1*r1 - r2*r2 + d*d) / (2*d)
    h_sq = r1*r1 - a*a
    if h_sq < 0:
        return None
    h = np.sqrt(h_sq)

    mx = cx1 + a * dx / d
    my = cy1 + a * dy / d

    return (
        (mx + h * dy / d, my - h * dx / d),
        (mx - h * dy / d, my + h * dx / d),
    )


def point_to_line_distance(
    px: float, py: float,
    lx1: float, ly1: float,
    lx2: float, ly2: float,
) -> float:
    """Perpendicular distance from point to line defined by two points."""
    dx = lx2 - lx1
    dy = ly2 - ly1
    length_sq = dx*dx + dy*dy
    if length_sq == 0:
        return distance((px, py), (lx1, ly1))

    num = abs(dy * px - dx * py + lx2 * ly1 - ly2 * lx1)
    return num / np.sqrt(length_sq)


def angle_between(
    p1: Tuple[float, float],
    vertex: Tuple[float, float],
    p2: Tuple[float, float],
) -> float:
    """Angle at vertex between rays to p1 and p2, in radians [0, π]."""
    v1x, v1y = p1[0] - vertex[0], p1[1] - vertex[1]
    v2x, v2y = p2[0] - vertex[0], p2[1] - vertex[1]

    dot = v1x * v2x + v1y * v2y
    cross = v1x * v2y - v1y * v2x

    return abs(np.arctan2(cross, dot))


def bounding_box(points: np.ndarray) -> Tuple[float, float, float, float]:
    """Return (minX, minY, maxX, maxY) of point array."""
    if len(points) == 0:
        return (0, 0, 0, 0)
    return (
        float(np.min(points[:, 0])),
        float(np.min(points[:, 1])),
        float(np.max(points[:, 0])),
        float(np.max(points[:, 1])),
    )
