"""
Search Space Bounds

Defines the parameter bounds for each mechanism type.
These constrain the optimization search space to physically
reasonable mechanism dimensions.

The bounds are automatically scaled based on the desired path extent.
"""

import numpy as np
from typing import Tuple, List

from ...utils.curve_utils import curve_extent, bounding_box


def get_bounds_four_bar(
    desired_points: np.ndarray = None,
    scale: float = 100.0,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Get parameter bounds for 4-bar optimization.

    Parameter vector: [a1, a2, a3, a4, p, alpha, ax, ay, dx, dy, theta2_0]
    (11 parameters)

    Returns:
        (lower_bounds, upper_bounds) as numpy arrays
    """
    if desired_points is not None and len(desired_points) >= 2:
        extent = curve_extent(desired_points)
        bbox = bounding_box(desired_points)
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        scale = max(extent, 10.0)
    else:
        cx, cy = 0.0, 0.0

    s = scale  # shorthand

    lower = np.array([
        s * 0.05,    # a1: ground length min
        s * 0.02,    # a2: crank min
        s * 0.05,    # a3: coupler min
        s * 0.03,    # a4: rocker min
        0.0,         # p: coupler point distance min
        0.0,         # alpha: coupler point angle min (degrees)
        cx - s * 2,  # ax: ground pivot A x
        cy - s * 2,  # ay: ground pivot A y
        cx - s * 2,  # dx: ground pivot D x
        cy - s * 2,  # dy: ground pivot D y
        0.0,         # theta2_0: initial crank angle (degrees)
    ])

    upper = np.array([
        s * 3.0,     # a1
        s * 1.5,     # a2
        s * 3.0,     # a3
        s * 2.0,     # a4
        s * 3.0,     # p
        360.0,       # alpha
        cx + s * 2,  # ax
        cy + s * 2,  # ay
        cx + s * 2,  # dx
        cy + s * 2,  # dy
        360.0,       # theta2_0
    ])

    return lower, upper


def get_bounds_slider_crank(
    desired_points: np.ndarray = None,
    scale: float = 100.0,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Get parameter bounds for slider-crank optimization.

    Parameter vector: [a2, a3, offset, p, alpha, ax, ay, slider_angle, theta2_0]
    (9 parameters)
    """
    if desired_points is not None and len(desired_points) >= 2:
        extent = curve_extent(desired_points)
        bbox = bounding_box(desired_points)
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        scale = max(extent, 10.0)
    else:
        cx, cy = 0.0, 0.0

    s = scale

    lower = np.array([
        s * 0.02,    # a2: crank min
        s * 0.05,    # a3: connecting rod min
        -s * 1.0,    # offset
        0.0,         # p
        0.0,         # alpha (degrees)
        cx - s * 2,  # ax
        cy - s * 2,  # ay
        -90.0,       # slider_angle (degrees)
        0.0,         # theta2_0
    ])

    upper = np.array([
        s * 1.0,     # a2
        s * 3.0,     # a3
        s * 1.0,     # offset
        s * 3.0,     # p
        360.0,       # alpha
        cx + s * 2,  # ax
        cy + s * 2,  # ay
        90.0,        # slider_angle
        360.0,       # theta2_0
    ])

    return lower, upper


def get_bounds(
    mechanism_type: str,
    desired_points: np.ndarray = None,
    scale: float = 100.0,
) -> Tuple[np.ndarray, np.ndarray]:
    """Dispatch to appropriate bounds function."""
    if mechanism_type == "four_bar":
        return get_bounds_four_bar(desired_points, scale)
    elif mechanism_type == "slider_crank":
        return get_bounds_slider_crank(desired_points, scale)
    elif mechanism_type in ("six_bar_watt", "six_bar_stephenson"):
        # Use 4-bar bounds as base (the dyad adds parameters, but we
        # optimize the base 4-bar first, then extend)
        return get_bounds_four_bar(desired_points, scale)
    else:
        return get_bounds_four_bar(desired_points, scale)


def get_num_params(mechanism_type: str) -> int:
    """Get the number of optimization parameters for a mechanism type."""
    params = {
        "four_bar": 11,
        "slider_crank": 9,
        "six_bar_watt": 11,  # Base 4-bar params (dyad optimized separately)
        "six_bar_stephenson": 11,
    }
    return params.get(mechanism_type, 11)
