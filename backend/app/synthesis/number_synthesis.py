"""
Number Synthesis

Determines the number of links and joints, verifies DOF = 1,
and enumerates possible topologies (isomers) for the chosen link count.

Gruebler's equation: F = 3(n − 1) − 2j₁ − j₂
For DOF = 1 with only lower pairs (j₂ = 0):
  - 4 links, 4 joints → F = 1
  - 6 links, 7 joints → F = 1
  - 8 links, 10 joints → F = 1
"""

from typing import Dict, List
from ..models.enums import MechanismType


def run_number_synthesis(mechanism_type: MechanismType) -> Dict:
    """
    Perform number synthesis — verify DOF and enumerate topology.

    Returns:
        dict with 'n', 'j1', 'j2', 'dof', 'dof_valid',
        'gruebler_steps', 'topology', 'isomers'
    """
    config = MECHANISM_CONFIGS[mechanism_type]

    n = config["n"]
    j1 = config["j1"]
    j2 = config["j2"]
    dof = 3 * (n - 1) - 2 * j1 - j2

    return {
        "n": n,
        "j1": j1,
        "j2": j2,
        "dof": dof,
        "dof_valid": dof == 1,

        # Step-by-step Gruebler calculation
        "gruebler_steps": [
            f"F = 3(n − 1) − 2j₁ − j₂",
            f"F = 3({n} − 1) − 2({j1}) − {j2}",
            f"F = 3({n - 1}) − {2 * j1} − {j2}",
            f"F = {3 * (n - 1)} − {2 * j1 + j2}",
            f"F = {dof}",
        ],

        # Topology info
        "topology": config["topology"],
        "isomers": config["isomers"],
        "joint_types": config["joint_types"],
        "link_types": config["link_types"],
        "description": config["description"],
    }


MECHANISM_CONFIGS = {
    MechanismType.FOUR_BAR: {
        "n": 4,
        "j1": 4,
        "j2": 0,
        "topology": "4R — closed kinematic chain with 4 revolute joints",
        "isomers": [
            {
                "name": "Standard 4-bar",
                "description": "One ground link, one input crank, one coupler, one output rocker",
                "link_sequence": "binary-binary-binary-binary",
            },
        ],
        "joint_types": ["R", "R", "R", "R"],
        "link_types": ["binary"] * 4,
        "description": (
            "The 4-bar linkage is the simplest planar mechanism with DOF = 1. "
            "It consists of 4 binary links connected by 4 revolute (pin) joints in a closed loop. "
            "One link is fixed (ground), giving 3 moving links controlled by 1 input."
        ),
    },

    MechanismType.SIX_BAR_WATT: {
        "n": 6,
        "j1": 7,
        "j2": 0,
        "topology": "Watt-I chain — two ternary links sharing a common joint",
        "isomers": [
            {
                "name": "Watt-I",
                "description": "Ternary links 3 and 4 share joint C. Dyad appended to ternary link.",
                "link_sequence": "binary-binary-ternary-ternary-binary-binary",
            },
            {
                "name": "Watt-II",
                "description": "Alternate joint configuration with ternary links adjacent.",
                "link_sequence": "binary-ternary-ternary-binary-binary-binary",
            },
        ],
        "joint_types": ["R"] * 7,
        "link_types": ["binary", "binary", "ternary", "ternary", "binary", "binary"],
        "description": (
            "The Watt 6-bar chain has 6 links and 7 revolute joints. "
            "Two ternary links (3 joints each) are adjacent, sharing a common joint. "
            "This gives 2 distinct isomers (Watt-I and Watt-II) depending on "
            "which link is grounded."
        ),
    },

    MechanismType.SIX_BAR_STEPHENSON: {
        "n": 6,
        "j1": 7,
        "j2": 0,
        "topology": "Stephenson chain — two ternary links not directly connected",
        "isomers": [
            {
                "name": "Stephenson-I",
                "description": "Ground link connects both ternary links. Input on ternary link.",
                "link_sequence": "ternary-binary-binary-ternary-binary-binary",
            },
            {
                "name": "Stephenson-II",
                "description": "Ground is binary link between ternary links.",
                "link_sequence": "binary-ternary-binary-binary-ternary-binary",
            },
            {
                "name": "Stephenson-III",
                "description": "Ground is binary link not between ternary links. Most common for path gen.",
                "link_sequence": "binary-binary-ternary-binary-binary-ternary",
            },
        ],
        "joint_types": ["R"] * 7,
        "link_types": ["binary", "binary", "ternary", "binary", "binary", "ternary"],
        "description": (
            "The Stephenson 6-bar chain has 6 links and 7 revolute joints. "
            "Two ternary links are separated (not sharing a joint). "
            "This gives 3 distinct isomers (I, II, III) depending on grounding."
        ),
    },

    MechanismType.SLIDER_CRANK: {
        "n": 4,
        "j1": 4,  # 3R + 1P both count as lower pairs
        "j2": 0,
        "topology": "3R + 1P — three revolute joints plus one prismatic (slider) joint",
        "isomers": [
            {
                "name": "Standard slider-crank",
                "description": "Crank drives connecting rod, slider moves linearly",
                "link_sequence": "binary-binary-binary-slider",
            },
        ],
        "joint_types": ["R", "R", "R", "P"],
        "link_types": ["binary", "binary", "binary", "slider"],
        "description": (
            "The slider-crank converts rotary motion to linear motion (or vice versa). "
            "It uses 3 revolute joints and 1 prismatic joint, giving DOF = 1. "
            "Both revolute and prismatic joints are lower pairs (remove 2 DOF each)."
        ),
    },
}
