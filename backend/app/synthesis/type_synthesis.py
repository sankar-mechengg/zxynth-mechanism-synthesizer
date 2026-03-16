"""
Type Synthesis

Determines what kind of mechanism to use based on the problem specification.
This is the first stage of the synthesis pipeline.

Decisions:
  1. Problem classification (path / function / motion)
  2. Mechanism family (linkage vs cam vs gear)
  3. Sub-type (4-bar, 6-bar, slider-crank)
  4. Recommended synthesis approach (analytical, optimization, or both)
"""

from typing import Dict, List
from ..models.enums import ProblemType, MechanismType


def run_type_synthesis(
    problem_type: ProblemType,
    mechanism_type: MechanismType,
    num_desired_points: int = 0,
    num_poses: int = 0,
    num_function_pairs: int = 0,
    has_timing: bool = False,
) -> Dict:
    """
    Perform type synthesis — classify the problem and recommend approach.

    Returns:
        dict with 'classification', 'recommended_methods', 'analytical_feasible',
        'max_analytical_points', 'notes'
    """
    result = {
        "problemType": problem_type.value,
        "mechanismType": mechanism_type.value,
        "classification": _classify_problem(problem_type),
        "mechanismFamily": "planar_linkage",
        "jointTypes": _get_joint_types(mechanism_type),
    }

    # Determine analytical feasibility based on problem type and data size
    if problem_type == ProblemType.PATH:
        max_analytical = 6 if not has_timing else 4
        n_data = num_desired_points
        result["max_analytical_points"] = max_analytical
        result["analytical_feasible"] = n_data <= max_analytical and n_data >= 3
        result["recommended_methods"] = _path_methods(n_data, has_timing, mechanism_type)

    elif problem_type == ProblemType.FUNCTION:
        max_analytical = 5  # Freudenstein: 3 exact, up to 5 with compatibility
        n_data = num_function_pairs
        result["max_analytical_points"] = max_analytical
        result["analytical_feasible"] = n_data <= max_analytical and n_data >= 2
        result["recommended_methods"] = _function_methods(n_data, mechanism_type)

    elif problem_type == ProblemType.MOTION:
        max_analytical = 5  # Burmester: up to 5 precision positions
        n_data = num_poses
        result["max_analytical_points"] = max_analytical
        result["analytical_feasible"] = n_data <= max_analytical and n_data >= 2
        result["recommended_methods"] = _motion_methods(n_data, mechanism_type)

    # Notes about the chosen mechanism type
    result["notes"] = _mechanism_notes(mechanism_type, problem_type)

    return result


def _classify_problem(pt: ProblemType) -> str:
    descriptions = {
        ProblemType.PATH: "Path Generation — a coupler point must trace a prescribed curve (x, y)",
        ProblemType.FUNCTION: "Function Generation — output angle must be a function of input angle: θ_out = f(θ_in)",
        ProblemType.MOTION: "Motion Generation — coupler link must pass through prescribed positions and orientations (x, y, θ)",
    }
    return descriptions.get(pt, "Unknown")


def _get_joint_types(mt: MechanismType) -> List[str]:
    if mt == MechanismType.SLIDER_CRANK:
        return ["revolute", "revolute", "revolute", "prismatic"]
    elif mt in (MechanismType.SIX_BAR_WATT, MechanismType.SIX_BAR_STEPHENSON):
        return ["revolute"] * 7
    else:
        return ["revolute"] * 4


def _path_methods(n: int, has_timing: bool, mt: MechanismType) -> List[Dict]:
    methods = []
    if n >= 3 and n <= 6 and not has_timing:
        methods.append({
            "name": "Precision-Point Synthesis",
            "type": "analytical",
            "description": f"Exact match at {min(n, 6)} Chebyshev-spaced points",
            "suitable": mt == MechanismType.FOUR_BAR,
        })
    methods.append({
        "name": "Global Optimization",
        "type": "optimization",
        "description": f"Minimize closest-point error across all {n} desired points",
        "suitable": True,
    })
    return methods


def _function_methods(n: int, mt: MechanismType) -> List[Dict]:
    methods = []
    if n >= 2 and n <= 5 and mt == MechanismType.FOUR_BAR:
        methods.append({
            "name": "Freudenstein Equation",
            "type": "analytical",
            "description": f"Solve {min(n, 3)} precision-point system for R₁, R₂, R₃ constants",
            "suitable": True,
        })
    methods.append({
        "name": "Global Optimization",
        "type": "optimization",
        "description": f"Minimize angular error across all {n} (θ_in, θ_out) pairs",
        "suitable": True,
    })
    return methods


def _motion_methods(n: int, mt: MechanismType) -> List[Dict]:
    methods = []
    if n >= 2 and n <= 5 and mt == MechanismType.FOUR_BAR:
        methods.append({
            "name": "Burmester Theory",
            "type": "analytical",
            "description": f"Circle-point / center-point analysis for {n} precision poses",
            "suitable": True,
        })
    methods.append({
        "name": "Global Optimization",
        "type": "optimization",
        "description": f"Minimize combined position + orientation error for {n} poses",
        "suitable": True,
    })
    return methods


def _mechanism_notes(mt: MechanismType, pt: ProblemType) -> List[str]:
    notes = []
    if mt == MechanismType.FOUR_BAR:
        notes.append("4-bar is the simplest single-DOF linkage. Start here; escalate to 6-bar if error exceeds tolerance.")
        notes.append("DOF = 3(4−1) − 2(4) = 1 ✓")
    elif mt == MechanismType.SIX_BAR_WATT:
        notes.append("6-bar Watt-I has two ternary links adjacent. More design freedom for complex curves.")
        notes.append("DOF = 3(6−1) − 2(7) = 1 ✓")
        notes.append("Constructed as a 4-bar base + appended dyad (2 links, 3 joints).")
    elif mt == MechanismType.SIX_BAR_STEPHENSON:
        notes.append("6-bar Stephenson-III has two ternary links separated. Different curve family than Watt.")
        notes.append("DOF = 3(6−1) − 2(7) = 1 ✓")
    elif mt == MechanismType.SLIDER_CRANK:
        notes.append("Slider-crank uses a prismatic joint for linear output motion.")
        notes.append("DOF = 3(4−1) − 2(3R+1P) = 1 ✓")
    return notes
