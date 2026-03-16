"""
Tests for 6-bar mechanism synthesis.
"""

import pytest
import numpy as np

from app.models.mechanism import SixBarWatt, SixBarStephenson
from app.synthesis.dimensional.six_bar_watt import synthesize_six_bar_watt
from app.synthesis.dimensional.six_bar_stephenson import synthesize_six_bar_stephenson


class TestSixBarWatt:
    """Test Watt-I 6-bar synthesis."""

    @pytest.fixture
    def circular_arc_path(self):
        """Simple circular arc test path."""
        t = np.linspace(0, np.pi / 2, 50)
        return np.column_stack([50 * np.cos(t), 50 * np.sin(t)])

    def test_watt_synthesis_returns_result(self, circular_arc_path):
        result = synthesize_six_bar_watt(
            problem_type="path",
            desired_data=circular_arc_path,
            algorithm="de",
            constraints={"grashofRequired": True, "minTransmissionAngle": 30, "tolerance": 10},
            hyperparams={"populationSize": 20, "maxGenerations": 10, "numSeeds": 1},
        )
        assert result is not None
        assert "optimization" in result or "analytical" in result

    def test_watt_mechanism_has_six_links(self):
        mech = SixBarWatt(
            a1=10, a2=3, a3=8, a4=7,
            a5=5, a6=6,
            pivot_a=(0, 0), pivot_d=(10, 0), pivot_e=(5, -5),
        )
        d = mech.to_dict()
        assert d["type"] == "six_bar_watt"
        assert d["a5"] == 5
        assert d["a6"] == 6
        assert d["pivotE"] is not None


class TestSixBarStephenson:
    """Test Stephenson-III 6-bar synthesis."""

    @pytest.fixture
    def s_curve_path(self):
        """S-shaped test path."""
        t = np.linspace(0, 1, 50)
        x = t * 80
        y = 40 / (1 + np.exp(-10 * (t - 0.5)))
        return np.column_stack([x, y])

    def test_stephenson_synthesis_returns_result(self, s_curve_path):
        result = synthesize_six_bar_stephenson(
            problem_type="path",
            desired_data=s_curve_path,
            algorithm="de",
            constraints={"grashofRequired": True, "minTransmissionAngle": 30, "tolerance": 10},
            hyperparams={"populationSize": 20, "maxGenerations": 10, "numSeeds": 1},
        )
        assert result is not None

    def test_stephenson_mechanism_structure(self):
        mech = SixBarStephenson(
            a1=10, a2=3, a3=8, a4=7,
            a5=4, a6=5,
            pivot_a=(0, 0), pivot_d=(10, 0), pivot_e=(12, -3),
        )
        d = mech.to_dict()
        assert d["type"] == "six_bar_stephenson"
        assert len(d["pivotE"]) == 2
