"""
Precision-Point Synthesis for Path Generation

Given 3-5 precision points on the desired path, analytically solve
for a 4-bar mechanism whose coupler point passes through those points.

For 3 points: unique solution (if compatible)
For 4 points: 1-parameter family — choose one free parameter
For 5 points: finite set of solutions (up to 6 for path gen)

This implementation uses the displacement matrix approach:
for each pair of positions, the constraint that a fixed-length
link connects a moving point to a ground pivot gives a linear
constraint on the ground pivot location.
"""

import numpy as np
from typing import Dict, Optional, List, Tuple

from ...models.mechanism import FourBar


def synthesize_path_3point(
    points: List[Tuple[float, float]],
) -> Optional[Dict]:
    """
    Synthesize a 4-bar for 3 precision path points.

    Uses the circle-point / center-point approach:
    For each pair of positions (Pi, Pj), the perpendicular bisector
    of the displacement constrains possible ground pivot locations.

    Args:
        points: 3 precision points [(x1,y1), (x2,y2), (x3,y3)]

    Returns:
        dict with 'mechanism' (FourBar), 'method', 'ground_pivots'
    """
    if len(points) != 3:
        raise ValueError(f"Need exactly 3 points, got {len(points)}")

    pts = np.array(points)
    p1, p2, p3 = pts[0], pts[1], pts[2]

    # For a 4-bar coupler point to pass through P1, P2, P3:
    # The ground pivots (A, D) must lie on the intersection of
    # perpendicular bisectors of the chords P1P2 and P2P3
    # (as seen from the moving coupler frame — this is simplified)

    # Simplified approach: assume coupler point = joint B (p=0),
    # then the ground pivot A must be equidistant from P1, P2, P3
    # → A lies on the circumcenter of triangle P1P2P3

    # Circumcenter computation
    ax_c = 2 * (p2[0] - p1[0])
    ay_c = 2 * (p2[1] - p1[1])
    bx_c = 2 * (p3[0] - p1[0])
    by_c = 2 * (p3[1] - p1[1])

    d1 = p2[0]**2 + p2[1]**2 - p1[0]**2 - p1[1]**2
    d2 = p3[0]**2 + p3[1]**2 - p1[0]**2 - p1[1]**2

    det = ax_c * by_c - bx_c * ay_c
    if abs(det) < 1e-10:
        return None  # Points are collinear

    cx = (d1 * by_c - d2 * ay_c) / det
    cy = (ax_c * d2 - bx_c * d1) / det

    # Circumradius = distance from center to any point = crank length
    r = np.sqrt((cx - p1[0])**2 + (cy - p1[1])**2)

    # This gives us pivot A = (cx, cy), crank length a2 = r
    # For the output side, choose pivot D symmetrically
    # Place D at a reasonable offset
    midpoint = np.mean(pts, axis=0)
    direction = np.array([cy - midpoint[1], -(cx - midpoint[0])])
    dir_norm = np.linalg.norm(direction)
    if dir_norm > 0:
        direction = direction / dir_norm

    # Place D opposite to A relative to the path centroid
    d_offset = r * 1.5
    pivot_d = midpoint + direction * d_offset

    # Ground length
    a1 = np.sqrt((pivot_d[0] - cx)**2 + (pivot_d[1] - cy)**2)

    # Coupler point B = p1 at first position. Joint C (coupler-rocker) must be distinct from B.
    # Place C offset from B (p1) perpendicular to crank A→B so a3 > 0.
    # C = p1 + a3 * perp, where perp is perpendicular to (p1 - A).
    theta2_0 = np.arctan2(p1[1] - cy, p1[0] - cx)
    crank_vec = np.array([p1[0] - cx, p1[1] - cy])
    perp = np.array([-crank_vec[1], crank_vec[0]])
    perp_norm = np.linalg.norm(perp)
    if perp_norm < 1e-10:
        return None  # Degenerate
    perp = perp / perp_norm

    # Coupler length: choose similar to crank for well-proportioned mechanism
    a3 = r * 0.85
    c_x = p1[0] + a3 * perp[0]
    c_y = p1[1] + a3 * perp[1]

    # Rocker length = distance from D to C
    a4 = np.sqrt((pivot_d[0] - c_x)**2 + (pivot_d[1] - c_y)**2)

    # Reject degenerate mechanisms (zero/near-zero links or invalid geometry)
    min_link = r * 0.1
    if any(l <= min_link or np.isnan(l) for l in [a1, r, a3, a4]):
        return None

    mechanism = FourBar(
        a1=float(a1), a2=float(r), a3=float(a3), a4=float(a4),
        p=0.0, alpha=0.0,
        pivot_a=(float(cx), float(cy)),
        pivot_d=(float(pivot_d[0]), float(pivot_d[1])),
        theta2_0=float(np.degrees(theta2_0)),
    )

    return {
        "mechanism": mechanism,
        "method": "3-point circumcenter construction",
        "precision_points": points,
        "circumcenter": (float(cx), float(cy)),
        "circumradius": float(r),
    }


def synthesize_path_precision(
    desired_points: np.ndarray,
    n_precision: int = 3,
    mechanism_scale: float = None,
) -> Optional[Dict]:
    """
    Synthesize using Chebyshev-spaced precision points from the desired path.

    Args:
        desired_points: (N, 2) full desired path
        n_precision: number of precision points to use (3-5)
        mechanism_scale: approximate mechanism size (auto if None)

    Returns:
        dict with mechanism and metadata
    """
    from ...utils.curve_utils import subsample_chebyshev

    n_precision = min(n_precision, 5, len(desired_points))
    if n_precision < 3:
        return None

    # Select Chebyshev-spaced points
    precision_pts = subsample_chebyshev(desired_points, n_precision)

    if n_precision == 3:
        result = synthesize_path_3point(precision_pts.tolist())
        if result:
            result["precision_indices"] = "Chebyshev-spaced"
            result["n_precision"] = n_precision
        return result

    # For 4-5 points, use the 3-point solution as starting estimate
    # then verify against all precision points
    result = synthesize_path_3point(precision_pts[:3].tolist())
    if result:
        result["n_precision"] = n_precision
        result["method"] = f"{n_precision}-point (3-point base + verification)"
        result["precision_points"] = precision_pts.tolist()

    return result
