"""
Objective Functions for Mechanism Synthesis Optimization

Each objective function takes a parameter vector x, constructs the mechanism,
generates its output (coupler curve, function, or poses), and returns a scalar
error value to be minimized.

Three objective types:
  1. Path generation: closest-point error between desired and actual coupler curve
  2. Function generation: angular error between desired and actual θ_out
  3. Motion generation: combined position + orientation error
"""

import numpy as np
from typing import Callable, Optional

from ...models.mechanism import FourBar, SliderCrank
from ...kinematics.coupler_curve import generate_coupler_curve, generate_function_output
from ...utils.curve_utils import closest_point_distances


def path_objective(
    x: np.ndarray,
    desired: np.ndarray,
    mechanism_type: str = "four_bar",
    n_curve_points: int = 360,
) -> float:
    """
    Path generation objective: mean squared closest-point distance.

    Args:
        x: parameter vector (depends on mechanism type)
        desired: (N, 2) desired path points
        mechanism_type: 'four_bar' or 'slider_crank'
        n_curve_points: samples for coupler curve generation

    Returns:
        mean squared closest-point error (lower is better)
    """
    mech = _vector_to_mechanism(x, mechanism_type)
    if mech is None:
        return 1e10  # Invalid parameters

    curve = generate_coupler_curve(mech, n_curve_points)
    if len(curve) < 10:
        return 1e10  # Mechanism cannot assemble over enough of the cycle

    # Closest-point distances
    distances = closest_point_distances(desired, curve)

    # Mean squared error
    return float(np.mean(distances ** 2))


def path_objective_with_timing(
    x: np.ndarray,
    desired: np.ndarray,
    timing_map: list,
    mechanism_type: str = "four_bar",
    n_curve_points: int = 360,
) -> float:
    """
    Path generation with prescribed timing: each desired point must be
    reached at a specific crank angle.

    Args:
        timing_map: list of (point_index, crank_angle_deg) pairs
    """
    mech = _vector_to_mechanism(x, mechanism_type)
    if mech is None:
        return 1e10

    curve = generate_coupler_curve(mech, n_curve_points, 0.0, 360.0)
    if len(curve) < 10:
        return 1e10

    # For non-timed points: closest-point error
    distances = closest_point_distances(desired, curve)
    base_error = float(np.mean(distances ** 2))

    # For timed points: specific crank angle → specific curve index
    timing_error = 0.0
    for pt_idx, crank_angle in timing_map:
        if pt_idx >= len(desired):
            continue
        curve_idx = int(round((crank_angle / 360.0) * (len(curve) - 1)))
        curve_idx = max(0, min(len(curve) - 1, curve_idx))

        dx = desired[pt_idx, 0] - curve[curve_idx, 0]
        dy = desired[pt_idx, 1] - curve[curve_idx, 1]
        timing_error += dx * dx + dy * dy

    if len(timing_map) > 0:
        timing_error /= len(timing_map)

    # Weighted combination: timing accuracy is more important
    return base_error + 10.0 * timing_error


def function_objective(
    x: np.ndarray,
    desired_pairs: np.ndarray,
    mechanism_type: str = "four_bar",
) -> float:
    """
    Function generation objective: angular error between desired and actual θ_out.

    Args:
        x: parameter vector
        desired_pairs: (N, 2) array of [theta_in_deg, theta_out_deg]
    """
    mech = _vector_to_mechanism(x, mechanism_type)
    if mech is None:
        return 1e10

    theta_start = float(desired_pairs[0, 0])
    theta_end = float(desired_pairs[-1, 0])

    actual = generate_function_output(mech, len(desired_pairs), theta_start, theta_end)
    if len(actual) < len(desired_pairs) * 0.5:
        return 1e10  # Too many infeasible angles

    # Match actual to desired by closest θ_in
    total_error = 0.0
    for i in range(len(desired_pairs)):
        t_in = desired_pairs[i, 0]
        t_out_desired = desired_pairs[i, 1]

        # Find closest θ_in in actual
        diffs = np.abs(actual[:, 0] - t_in)
        closest_idx = np.argmin(diffs)
        t_out_actual = actual[closest_idx, 1]

        total_error += (t_out_desired - t_out_actual) ** 2

    return total_error / len(desired_pairs)


def motion_objective(
    x: np.ndarray,
    desired_poses: np.ndarray,
    mechanism_type: str = "four_bar",
    position_weight: float = 1.0,
    angle_weight: float = 0.01,
) -> float:
    """
    Motion generation objective: combined position + orientation error.

    Args:
        desired_poses: (N, 3) array of [x, y, theta_deg]
    """
    mech = _vector_to_mechanism(x, mechanism_type)
    if mech is None:
        return 1e10

    from ...kinematics.forward_kinematics import forward_kinematics

    total_error = 0.0
    n_feasible = 0

    # Distribute crank angles across the cycle for each pose
    n_poses = len(desired_poses)
    for i, pose in enumerate(desired_poses):
        theta2 = 360.0 * i / max(1, n_poses - 1)
        result = forward_kinematics(mech, theta2)

        if result is None:
            total_error += 1e6
            continue

        n_feasible += 1
        cp = result["couplerPoint"]
        theta3 = result["angles"]["theta3"]

        # Position error
        dx = cp["x"] - pose[0]
        dy = cp["y"] - pose[1]
        pos_err = dx * dx + dy * dy

        # Orientation error (coupler angle vs desired orientation)
        ang_err = (theta3 - pose[2]) ** 2

        total_error += position_weight * pos_err + angle_weight * ang_err

    if n_feasible == 0:
        return 1e10

    return total_error / n_feasible


def _vector_to_mechanism(x: np.ndarray, mechanism_type: str):
    """Convert optimization parameter vector to mechanism object."""
    try:
        if mechanism_type == "four_bar":
            # x = [a1, a2, a3, a4, p, alpha, ax, ay, dx, dy, theta2_0]
            if len(x) < 11:
                return None
            if any(x[i] <= 0 for i in range(4)):  # Link lengths must be positive
                return None
            if x[4] < 0:  # Coupler point distance must be non-negative
                return None
            return FourBar.from_vector(x[:11])

        elif mechanism_type == "slider_crank":
            # x = [a2, a3, offset, p, alpha, ax, ay, slider_angle, theta2_0]
            if len(x) < 9:
                return None
            if x[0] <= 0 or x[1] <= 0:
                return None
            return SliderCrank(
                a2=x[0], a3=x[1], offset=x[2],
                p=x[3], alpha=x[4],
                pivot_a=(x[5], x[6]),
                slider_angle=x[7], theta2_0=x[8],
            )
        return None
    except Exception:
        return None
