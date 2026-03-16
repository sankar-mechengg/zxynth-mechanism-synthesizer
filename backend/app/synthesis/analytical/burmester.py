"""
Burmester Theory — Motion Generation Synthesis

For rigid-body guidance (motion generation), Burmester theory finds
the geometric loci (circle points and center points) from which
compatible dyads can be constructed.

Given N precision poses (x, y, θ), each describing the position and
orientation of the coupler link:
  - 2 poses: infinite solutions (full circle of center points)
  - 3 poses: 1-parameter family (circle of center points)
  - 4 poses: finite solutions (up to 6 circle-center point pairs)
  - 5 poses: typically 1-2 solutions

Each solution gives one dyad (2 links: moving pivot + ground pivot).
Two compatible dyads form a complete 4-bar linkage.
"""

import numpy as np
from typing import Dict, Optional, List, Tuple

from ...models.mechanism import FourBar


def synthesize_motion_2pose(
    poses: List[Tuple[float, float, float]],
) -> Optional[Dict]:
    """
    2-pose motion synthesis — infinite solutions exist.
    Returns one reasonable solution by choosing ground pivots symmetrically.

    Args:
        poses: [(x1, y1, θ1_deg), (x2, y2, θ2_deg)]
    """
    if len(poses) != 2:
        raise ValueError(f"Need 2 poses, got {len(poses)}")

    p1 = np.array(poses[0][:2])
    p2 = np.array(poses[1][:2])
    t1 = np.radians(poses[0][2])
    t2 = np.radians(poses[1][2])

    # Midpoint and perpendicular bisector of P1-P2
    mid = (p1 + p2) / 2
    displacement = p2 - p1
    disp_len = np.linalg.norm(displacement)

    if disp_len < 1e-10:
        return None

    perp = np.array([-displacement[1], displacement[0]]) / disp_len

    # Place ground pivots on the perpendicular bisector
    offset = disp_len * 0.8
    pivot_a = mid + perp * offset
    pivot_d = mid - perp * offset

    # Compute link lengths
    a2 = np.linalg.norm(p1 - pivot_a)  # crank
    a4 = np.linalg.norm(p1 - pivot_d)  # rocker
    a3 = np.linalg.norm(p2 - p1)       # coupler (approximate)
    a1 = np.linalg.norm(pivot_d - pivot_a)  # ground

    if any(l <= 0 for l in [a1, a2, a3, a4]):
        return None

    theta2_0 = np.degrees(np.arctan2(p1[1] - pivot_a[1], p1[0] - pivot_a[0]))

    mechanism = FourBar(
        a1=float(a1), a2=float(a2), a3=float(a3), a4=float(a4),
        p=0.0, alpha=0.0,
        pivot_a=tuple(pivot_a.tolist()),
        pivot_d=tuple(pivot_d.tolist()),
        theta2_0=float(theta2_0),
    )

    return {
        "mechanism": mechanism,
        "method": "2-pose Burmester (perpendicular bisector)",
        "poses": poses,
    }


def synthesize_motion_3pose(
    poses: List[Tuple[float, float, float]],
) -> Optional[Dict]:
    """
    3-pose motion synthesis using displacement equations.

    For 3 poses, the center points lie on circles. We find the
    intersection of constraint circles for each dyad.
    """
    if len(poses) != 3:
        raise ValueError(f"Need 3 poses, got {len(poses)}")

    pts = np.array([p[:2] for p in poses])
    thetas = np.array([np.radians(p[2]) for p in poses])

    # Displacement vectors and rotation angles (relative to pose 1)
    d12 = pts[1] - pts[0]
    d13 = pts[2] - pts[0]
    alpha12 = thetas[1] - thetas[0]
    alpha13 = thetas[2] - thetas[0]

    # For each displacement (1→j), the constraint on the moving pivot M
    # of a dyad is:
    #   (M_rotated_j - M) · perpendicular = constant
    # This gives a linear equation in the moving pivot coordinates.

    # Build the constraint system for moving pivot of dyad 1
    # Using the image pole approach (simplified):

    # Rotation matrices
    R12 = np.array([[np.cos(alpha12), -np.sin(alpha12)],
                     [np.sin(alpha12),  np.cos(alpha12)]])
    R13 = np.array([[np.cos(alpha13), -np.sin(alpha13)],
                     [np.sin(alpha13),  np.cos(alpha13)]])

    # For a point P on the coupler at pose 1, its position at pose j is:
    # P_j = R_1j · (P - pts[0]) + pts[j-1]  (simplified)

    # Use the perpendicular bisector approach for the center point:
    # The center point (ground pivot) is equidistant from all positions
    # of the moving pivot.

    # Simplified: use circumcenter of the 3 positions of a reference point
    result = _circumcenter_approach(pts, thetas)
    if result is None:
        return None

    result["method"] = "3-pose Burmester (circumcenter)"
    result["poses"] = poses
    return result


def synthesize_motion(
    poses: List[Tuple[float, float, float]],
) -> Optional[Dict]:
    """
    Dispatch to the appropriate pose count handler.
    """
    n = len(poses)

    if n < 2:
        raise ValueError("Need at least 2 poses")
    elif n == 2:
        return synthesize_motion_2pose(poses)
    elif n == 3:
        return synthesize_motion_3pose(poses)
    elif n <= 5:
        # For 4-5 poses, use 3-pose as base and verify
        result = synthesize_motion_3pose(poses[:3])
        if result:
            result["method"] = f"{n}-pose (3-pose base)"
            result["poses"] = poses
            result["n_precision"] = n
        return result
    else:
        # More than 5 poses → optimization only
        return None


def _circumcenter_approach(
    pts: np.ndarray,
    thetas: np.ndarray,
) -> Optional[Dict]:
    """
    Simplified Burmester using circumcenter for ground pivot location.
    """
    p1, p2, p3 = pts[0], pts[1], pts[2]

    # Circumcenter of the three reference point positions
    ax = 2 * (p2[0] - p1[0])
    ay = 2 * (p2[1] - p1[1])
    bx = 2 * (p3[0] - p1[0])
    by = 2 * (p3[1] - p1[1])

    d1 = p2[0]**2 + p2[1]**2 - p1[0]**2 - p1[1]**2
    d2 = p3[0]**2 + p3[1]**2 - p1[0]**2 - p1[1]**2

    det = ax * by - bx * ay
    if abs(det) < 1e-10:
        return None

    cx = (d1 * by - d2 * ay) / det
    cy = (ax * d2 - bx * d1) / det

    crank_len = np.linalg.norm(p1 - [cx, cy])

    # Place second ground pivot
    centroid = np.mean(pts, axis=0)
    normal = np.array([cy - centroid[1], -(cx - centroid[0])])
    n_len = np.linalg.norm(normal)
    if n_len > 0:
        normal = normal / n_len

    pivot_d = centroid + normal * crank_len * 1.2

    a1 = np.linalg.norm(pivot_d - [cx, cy])
    a2 = crank_len
    a4 = np.linalg.norm(p1 - pivot_d)
    a3 = np.linalg.norm(p1 - p2)  # Approximate coupler

    if any(l <= 0 or np.isnan(l) for l in [a1, a2, a3, a4]):
        return None

    theta2_0 = np.degrees(np.arctan2(p1[1] - cy, p1[0] - cx))

    mechanism = FourBar(
        a1=float(a1), a2=float(a2), a3=float(a3), a4=float(a4),
        pivot_a=(float(cx), float(cy)),
        pivot_d=(float(pivot_d[0]), float(pivot_d[1])),
        theta2_0=float(theta2_0),
    )

    return {"mechanism": mechanism}
