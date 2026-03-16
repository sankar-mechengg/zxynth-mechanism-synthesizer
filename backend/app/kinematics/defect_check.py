"""
Defect Detection

Checks for two critical defects in synthesized mechanisms:

1. Branch Defect: The mechanism changes assembly mode (branch) during
   operation, which means it would physically lock or jump between
   configurations. Detected by checking if the discriminant of the
   loop-closure equation changes sign during crank rotation.

2. Order Defect: Precision points are reached in the wrong sequence.
   The coupler point passes through the desired positions in a
   different order than intended.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple

from .loop_closure import solve_four_bar
from ..models.mechanism import FourBar


def check_branch_defect(
    mech: FourBar,
    n_samples: int = 360,
    theta_start: float = 0.0,
    theta_end: float = 360.0,
) -> Dict:
    """
    Check for branch defect by monitoring the assembly configuration
    throughout the crank rotation.

    A branch defect occurs when the mechanism must switch from one
    assembly mode to another to continue motion — this is physically
    impossible without disassembly.

    Detection method: Track the sign of the cross product at joint C
    (which determines the assembly branch). If it changes sign,
    a branch defect exists.

    Returns:
        dict with 'has_defect', 'defect_angle' (where it occurs), 'details'
    """
    angles = np.linspace(
        np.radians(theta_start),
        np.radians(theta_end),
        n_samples,
        endpoint=False,
    )

    cross_products = []
    infeasible_angles = []

    for theta2 in angles:
        # Solve for both branches
        r0 = solve_four_bar(
            mech.a1, mech.a2, mech.a3, mech.a4,
            theta2, mech.pivot_a, mech.pivot_d, branch=0,
        )
        r1 = solve_four_bar(
            mech.a1, mech.a2, mech.a3, mech.a4,
            theta2, mech.pivot_a, mech.pivot_d, branch=1,
        )

        if r0 is None:
            infeasible_angles.append(float(np.degrees(theta2)))
            continue

        # Cross product of coupler vector (B→C) with rocker vector (D→C)
        # The sign determines which assembly branch we're on
        bx, by = r0["B"]
        cx, cy = r0["C"]
        dx, dy = r0["D"]

        bc_x, bc_y = cx - bx, cy - by
        dc_x, dc_y = cx - dx, cy - dy
        cross = bc_x * dc_y - bc_y * dc_x
        cross_products.append(cross)

    if len(cross_products) < 2:
        return {
            "has_defect": True,
            "details": ["Mechanism cannot assemble over most of the rotation range"],
            "defect_angle": None,
        }

    # Check for sign change in cross products
    signs = np.sign(cross_products)
    sign_changes = np.where(np.diff(signs) != 0)[0]

    has_defect = len(sign_changes) > 0

    details = []
    defect_angle = None

    if has_defect:
        # Find the first sign change angle
        idx = sign_changes[0]
        defect_angle = float(np.degrees(angles[idx]))
        details.append(
            f"Branch defect detected near θ₂ = {defect_angle:.1f}°. "
            f"The mechanism switches assembly mode at this angle."
        )
        details.append(
            f"Total sign changes: {len(sign_changes)} over the rotation cycle."
        )

    if len(infeasible_angles) > 0:
        details.append(
            f"Infeasible angles: {len(infeasible_angles)} positions out of {n_samples} "
            f"(mechanism cannot assemble)."
        )

    return {
        "has_defect": has_defect,
        "defect_angle": defect_angle,
        "num_sign_changes": len(sign_changes),
        "num_infeasible": len(infeasible_angles),
        "details": details,
    }


def check_order_defect(
    mech: FourBar,
    desired_points: np.ndarray,
    precision_indices: Optional[List[int]] = None,
    n_curve_samples: int = 360,
) -> Dict:
    """
    Check for order defect — whether precision points are reached
    in the correct sequence along the coupler curve.

    An order defect means the coupler point passes through the
    desired positions in a different order than intended.

    Args:
        mech: FourBar mechanism
        desired_points: (N, 2) array of desired path points (in order)
        precision_indices: indices of precision points within desired_points
                          (if None, uses first, middle, last)
        n_curve_samples: number of samples for the coupler curve

    Returns:
        dict with 'has_defect', 'expected_order', 'actual_order', 'details'
    """
    from .coupler_curve import generate_coupler_curve

    # Generate coupler curve
    curve = generate_coupler_curve(mech, n_curve_samples)
    if len(curve) < 10:
        return {
            "has_defect": True,
            "details": ["Coupler curve too short for order check"],
        }

    # Select precision points to check
    if precision_indices is None:
        n_pts = len(desired_points)
        if n_pts <= 3:
            precision_indices = list(range(n_pts))
        else:
            precision_indices = [0, n_pts // 4, n_pts // 2, 3 * n_pts // 4, n_pts - 1]

    precision_points = desired_points[precision_indices]

    # For each precision point, find which curve index is closest
    curve_indices = []
    for pp in precision_points:
        dists = np.sum((curve - pp) ** 2, axis=1)
        closest_idx = int(np.argmin(dists))
        curve_indices.append(closest_idx)

    # Check if curve indices are monotonically increasing
    expected_order = list(range(len(precision_indices)))
    actual_order = list(np.argsort(curve_indices))

    has_defect = actual_order != expected_order

    details = []
    if has_defect:
        details.append(
            f"Order defect: precision points are reached in sequence "
            f"{actual_order} instead of {expected_order}."
        )
        # Check if it's just reversed
        if actual_order == list(reversed(expected_order)):
            details.append(
                "The path is traced in reverse direction. This may be "
                "acceptable if timing is not prescribed."
            )
    else:
        details.append("No order defect: precision points reached in correct sequence.")

    return {
        "has_defect": has_defect,
        "expected_order": expected_order,
        "actual_order": actual_order,
        "curve_indices": curve_indices,
        "details": details,
    }


def full_defect_check(
    mech: FourBar,
    desired_points: Optional[np.ndarray] = None,
) -> Dict:
    """
    Run all defect checks on a mechanism.

    Returns:
        dict with 'branch', 'order', 'has_any_defect', 'details'
    """
    branch_result = check_branch_defect(mech)

    order_result = {"has_defect": False, "details": []}
    if desired_points is not None and len(desired_points) >= 3:
        order_result = check_order_defect(mech, desired_points)

    all_details = branch_result.get("details", []) + order_result.get("details", [])
    has_any = branch_result["has_defect"] or order_result["has_defect"]

    return {
        "branch": branch_result["has_defect"],
        "order": order_result["has_defect"],
        "has_any_defect": has_any,
        "details": all_details,
    }
