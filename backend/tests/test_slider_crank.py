"""
Tests for slider-crank mechanism.
"""

import pytest
import numpy as np

from app.models.mechanism import SliderCrank
from app.kinematics.loop_closure import solve_slider_crank
from app.kinematics.coupler_curve import generate_coupler_curve_slider_crank


class TestSliderCrankKinematics:
    """Test slider-crank loop closure and kinematics."""

    def test_solves_at_zero(self):
        result = solve_slider_crank(a2=3, a3=8, theta2=0.0)
        assert result is not None
        assert "B" in result
        assert "C" in result
        assert "slider_pos" in result

    def test_crank_distance(self):
        """Joint B should be at distance a2 from pivot A."""
        result = solve_slider_crank(a2=5, a3=12, theta2=np.pi / 3)
        assert result is not None
        bx, by = result["B"]
        ax, ay = result["A"]
        dist = np.sqrt((bx - ax)**2 + (by - ay)**2)
        assert abs(dist - 5.0) < 1e-10

    def test_rod_length_preserved(self):
        """Distance B-C should equal a3."""
        result = solve_slider_crank(a2=5, a3=12, theta2=1.5)
        assert result is not None
        bx, by = result["B"]
        cx, cy = result["C"]
        dist = np.sqrt((cx - bx)**2 + (cy - by)**2)
        assert abs(dist - 12.0) < 1e-8

    def test_slider_on_axis(self):
        """Slider C should be on the slider axis (y = offset)."""
        result = solve_slider_crank(a2=5, a3=12, theta2=0.8, offset=2.0)
        assert result is not None
        cy = result["C"][1]
        assert abs(cy - 2.0) < 1e-8

    def test_coupler_curve_generation(self):
        mech = SliderCrank(a2=5, a3=12, p=6, alpha=30.0)
        curve = generate_coupler_curve_slider_crank(mech, 100)
        assert len(curve) > 50

    def test_invalid_returns_none(self):
        """Crank longer than rod — can't reach at some angles."""
        result = solve_slider_crank(a2=15, a3=5, theta2=np.pi / 2)
        assert result is None


class TestSliderCrankModel:
    """Test SliderCrank dataclass."""

    def test_to_dict(self):
        mech = SliderCrank(a2=5, a3=12, offset=1.5, p=4, alpha=45,
                            pivot_a=(10, 20), slider_angle=0)
        d = mech.to_dict()
        assert d["type"] == "slider_crank"
        assert d["a2"] == 5
        assert d["a3"] == 12
        assert d["offset"] == 1.5
