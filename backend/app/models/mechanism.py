"""
Mechanism dataclasses for internal computation.
These hold the physical parameters and provide utility methods
for kinematics and constraint checking.
"""

from dataclasses import dataclass, field
from typing import Optional, Tuple, List
import numpy as np


@dataclass
class FourBar:
    """4-bar linkage parameters."""
    a1: float  # Ground link length
    a2: float  # Input crank length
    a3: float  # Coupler length
    a4: float  # Output rocker length

    # Coupler point offset (from joint B, in coupler frame)
    p: float = 0.0        # Distance from B to coupler point P
    alpha: float = 0.0    # Angle of BP relative to BC (degrees)

    # Ground pivot locations
    pivot_a: Tuple[float, float] = (0.0, 0.0)  # Input ground pivot A
    pivot_d: Tuple[float, float] = (1.0, 0.0)  # Output ground pivot D

    # Initial crank angle
    theta2_0: float = 0.0  # degrees

    @property
    def links(self) -> np.ndarray:
        """Link lengths as array [a1, a2, a3, a4]."""
        return np.array([self.a1, self.a2, self.a3, self.a4])

    @property
    def sorted_links(self) -> np.ndarray:
        """Link lengths sorted ascending."""
        return np.sort(self.links)

    @property
    def shortest(self) -> float:
        return float(self.sorted_links[0])

    @property
    def longest(self) -> float:
        return float(self.sorted_links[-1])

    @property
    def is_grashof(self) -> bool:
        """Check Grashof condition: s + l <= p + q."""
        s = self.sorted_links
        return float(s[0] + s[3]) <= float(s[1] + s[2])

    @property
    def grashof_margin(self) -> float:
        """Margin: (p + q) - (s + l). Positive = Grashof."""
        s = self.sorted_links
        return float((s[1] + s[2]) - (s[0] + s[3]))

    @property
    def ground_angle(self) -> float:
        """Angle of ground link (A→D) in degrees."""
        dx = self.pivot_d[0] - self.pivot_a[0]
        dy = self.pivot_d[1] - self.pivot_a[1]
        return float(np.degrees(np.arctan2(dy, dx)))

    @property
    def ground_length(self) -> float:
        """Distance between ground pivots (should equal a1)."""
        dx = self.pivot_d[0] - self.pivot_a[0]
        dy = self.pivot_d[1] - self.pivot_a[1]
        return float(np.sqrt(dx * dx + dy * dy))

    def to_vector(self) -> np.ndarray:
        """Flatten to optimization parameter vector."""
        return np.array([
            self.a1, self.a2, self.a3, self.a4,
            self.p, self.alpha,
            self.pivot_a[0], self.pivot_a[1],
            self.pivot_d[0], self.pivot_d[1],
            self.theta2_0,
        ])

    @classmethod
    def from_vector(cls, v: np.ndarray) -> "FourBar":
        """Reconstruct from optimization parameter vector."""
        return cls(
            a1=v[0], a2=v[1], a3=v[2], a4=v[3],
            p=v[4], alpha=v[5],
            pivot_a=(v[6], v[7]),
            pivot_d=(v[8], v[9]),
            theta2_0=v[10],
        )

    def to_dict(self) -> dict:
        """Convert to serializable dict matching MechanismParams schema."""
        return {
            "type": "four_bar",
            "a1": self.a1, "a2": self.a2, "a3": self.a3, "a4": self.a4,
            "p": self.p, "alpha": self.alpha,
            "pivotA": list(self.pivot_a), "pivotD": list(self.pivot_d),
            "groundAngle": self.ground_angle,
            "groundLength": self.ground_length,
            "theta2_0": self.theta2_0,
            "grashofMargin": self.grashof_margin,
        }


@dataclass
class SixBarWatt:
    """6-bar Watt-I linkage parameters.
    Constructed as a 4-bar base + a dyad extension.
    """
    # Base 4-bar
    a1: float; a2: float; a3: float; a4: float
    # Dyad extension (link 5 and link 6)
    a5: float = 0.0; a6: float = 0.0
    # Coupler point
    p: float = 0.0; alpha: float = 0.0
    # Ground pivots (3 for Watt-I)
    pivot_a: Tuple[float, float] = (0.0, 0.0)
    pivot_d: Tuple[float, float] = (1.0, 0.0)
    pivot_e: Tuple[float, float] = (0.5, -0.5)
    # Dyad attachment angle on the ternary link
    dyad_angle: float = 0.0
    dyad_offset: float = 0.0
    theta2_0: float = 0.0

    def to_dict(self) -> dict:
        return {
            "type": "six_bar_watt",
            "a1": self.a1, "a2": self.a2, "a3": self.a3, "a4": self.a4,
            "a5": self.a5, "a6": self.a6,
            "p": self.p, "alpha": self.alpha,
            "pivotA": list(self.pivot_a), "pivotD": list(self.pivot_d),
            "pivotE": list(self.pivot_e),
            "theta2_0": self.theta2_0,
        }


@dataclass
class SixBarStephenson:
    """6-bar Stephenson-III linkage parameters."""
    a1: float; a2: float; a3: float; a4: float
    a5: float = 0.0; a6: float = 0.0
    p: float = 0.0; alpha: float = 0.0
    pivot_a: Tuple[float, float] = (0.0, 0.0)
    pivot_d: Tuple[float, float] = (1.0, 0.0)
    pivot_e: Tuple[float, float] = (0.5, -0.5)
    dyad_angle: float = 0.0
    dyad_offset: float = 0.0
    theta2_0: float = 0.0

    def to_dict(self) -> dict:
        return {
            "type": "six_bar_stephenson",
            "a1": self.a1, "a2": self.a2, "a3": self.a3, "a4": self.a4,
            "a5": self.a5, "a6": self.a6,
            "p": self.p, "alpha": self.alpha,
            "pivotA": list(self.pivot_a), "pivotD": list(self.pivot_d),
            "pivotE": list(self.pivot_e),
            "theta2_0": self.theta2_0,
        }


@dataclass
class SliderCrank:
    """Slider-crank mechanism parameters."""
    a2: float  # Crank length
    a3: float  # Connecting rod (coupler) length
    offset: float = 0.0  # Slider offset from crank pivot axis

    # Coupler point
    p: float = 0.0
    alpha: float = 0.0

    # Ground pivot (crank center)
    pivot_a: Tuple[float, float] = (0.0, 0.0)

    # Slider axis angle (degrees from horizontal)
    slider_angle: float = 0.0

    theta2_0: float = 0.0

    @property
    def a1(self) -> float:
        """Virtual ground link (not a physical link)."""
        return 0.0

    @property
    def a4(self) -> float:
        """Virtual output link (slider has infinite effective length)."""
        return 0.0

    def to_dict(self) -> dict:
        return {
            "type": "slider_crank",
            "a2": self.a2, "a3": self.a3,
            "offset": self.offset,
            "p": self.p, "alpha": self.alpha,
            "pivotA": list(self.pivot_a),
            "sliderAngle": self.slider_angle,
            "theta2_0": self.theta2_0,
        }
