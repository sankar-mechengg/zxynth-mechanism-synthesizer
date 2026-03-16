"""
Enumerations used throughout the application.
"""

from enum import Enum


class ProblemType(str, Enum):
    """The three classical problems of mechanism synthesis."""
    PATH = "path"
    FUNCTION = "function"
    MOTION = "motion"


class MechanismType(str, Enum):
    """Supported mechanism topologies."""
    FOUR_BAR = "four_bar"
    SIX_BAR_WATT = "six_bar_watt"
    SIX_BAR_STEPHENSON = "six_bar_stephenson"
    SLIDER_CRANK = "slider_crank"


class Algorithm(str, Enum):
    """Optimization algorithms."""
    DE = "de"           # Differential Evolution + Nelder-Mead
    GA = "ga"           # Genetic Algorithm
    PSO = "pso"         # Particle Swarm Optimization
    SA = "sa"           # Simulated Annealing


class JointType(str, Enum):
    """Joint types for planar mechanisms."""
    REVOLUTE = "revolute"
    PRISMATIC = "prismatic"


class GrashofType(str, Enum):
    """Grashof classification for 4-bar linkages."""
    CRANK_ROCKER = "crank-rocker"
    DOUBLE_CRANK = "double-crank"
    DOUBLE_ROCKER = "double-rocker"
    CHANGE_POINT = "change-point"
    NON_GRASHOF = "non-grashof"


class JobStatus(str, Enum):
    """Synthesis job status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"
