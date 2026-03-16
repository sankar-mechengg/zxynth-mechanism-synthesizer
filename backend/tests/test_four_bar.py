"""
Tests for 4-bar mechanism kinematics.
Verifies loop closure, forward kinematics, and coupler curve generation
against known analytical results.
"""

import pytest
import numpy as np

from app.models.mechanism import FourBar
from app.kinematics.loop_closure import solve_four_bar, check_assemblability
from app.kinematics.forward_kinematics import forward_kinematics_four_bar
from app.kinematics.coupler_curve import generate_coupler_curve_four_bar


class TestLoopClosure:
    """Test the 4-bar loop-closure solver."""

    def test_simple_four_bar_solves(self):
        """A standard Grashof 4-bar should solve at θ₂=0."""
        result = solve_four_bar(
            a1=10, a2=3, a3=8, a4=7,
            theta2=0.0,
            pivot_a=(0, 0), pivot_d=(10, 0),
        )
        assert result is not None
        assert "B" in result
        assert "C" in result

    def test_joint_B_position(self):
        """Joint B should be at distance a2 from pivot A."""
        result = solve_four_bar(
            a1=10, a2=3, a3=8, a4=7,
            theta2=np.pi / 4,  # 45 degrees
            pivot_a=(0, 0), pivot_d=(10, 0),
        )
        assert result is not None
        bx, by = result["B"]
        dist_ab = np.sqrt(bx**2 + by**2)
        assert abs(dist_ab - 3.0) < 1e-10

    def test_coupler_length_preserved(self):
        """Distance B-C should equal a3."""
        result = solve_four_bar(
            a1=10, a2=3, a3=8, a4=7,
            theta2=1.0,
            pivot_a=(0, 0), pivot_d=(10, 0),
        )
        assert result is not None
        bx, by = result["B"]
        cx, cy = result["C"]
        dist_bc = np.sqrt((cx - bx)**2 + (cy - by)**2)
        assert abs(dist_bc - 8.0) < 1e-8

    def test_rocker_length_preserved(self):
        """Distance D-C should equal a4."""
        result = solve_four_bar(
            a1=10, a2=3, a3=8, a4=7,
            theta2=2.0,
            pivot_a=(0, 0), pivot_d=(10, 0),
        )
        assert result is not None
        cx, cy = result["C"]
        dx, dy = result["D"]
        dist_dc = np.sqrt((cx - dx)**2 + (cy - dy)**2)
        assert abs(dist_dc - 7.0) < 1e-8

    def test_infeasible_returns_none(self):
        """Mechanism that can't assemble should return None."""
        result = solve_four_bar(
            a1=100, a2=1, a3=1, a4=1,  # Ground way too long
            theta2=0.0,
        )
        assert result is None

    def test_both_branches(self):
        """Two assembly branches should give different C positions."""
        r0 = solve_four_bar(10, 3, 8, 7, 0.5, branch=0)
        r1 = solve_four_bar(10, 3, 8, 7, 0.5, branch=1)
        assert r0 is not None and r1 is not None
        # C positions should differ
        assert abs(r0["C"][1] - r1["C"][1]) > 0.1

    def test_assemblability_grashof(self):
        """A Grashof mechanism should assemble over full 360°."""
        result = check_assemblability(10, 3, 8, 7)
        assert result["full_rotation"] is True
        assert result["num_feasible"] == 360


class TestForwardKinematics:
    """Test forward kinematics computation."""

    def test_returns_all_joints(self):
        mech = FourBar(a1=10, a2=3, a3=8, a4=7, pivot_a=(0, 0), pivot_d=(10, 0))
        result = forward_kinematics_four_bar(mech, 45.0)
        assert result is not None
        assert len(result["joints"]) == 4
        assert len(result["links"]) == 4

    def test_coupler_point_with_offset(self):
        """Coupler point should be offset from B by (p, α)."""
        mech = FourBar(a1=10, a2=3, a3=8, a4=7, p=5.0, alpha=30.0,
                        pivot_a=(0, 0), pivot_d=(10, 0))
        result = forward_kinematics_four_bar(mech, 0.0)
        assert result is not None
        cp = result["couplerPoint"]
        # Coupler point should exist and be different from joint B
        bx = result["joints"][1]["x"]
        by = result["joints"][1]["y"]
        dist = np.sqrt((cp["x"] - bx)**2 + (cp["y"] - by)**2)
        assert abs(dist - 5.0) < 1e-8  # Should be exactly p=5

    def test_ground_joints_fixed(self):
        mech = FourBar(a1=10, a2=3, a3=8, a4=7, pivot_a=(5, 5), pivot_d=(15, 5))
        result = forward_kinematics_four_bar(mech, 90.0)
        assert result is not None
        assert result["joints"][0]["isFixed"] is True
        assert result["joints"][3]["isFixed"] is True
        assert abs(result["joints"][0]["x"] - 5.0) < 1e-10


class TestCouplerCurve:
    """Test coupler curve generation."""

    def test_generates_points(self):
        mech = FourBar(a1=10, a2=3, a3=8, a4=7, p=5.0, alpha=0.0,
                        pivot_a=(0, 0), pivot_d=(10, 0))
        curve = generate_coupler_curve_four_bar(mech, n_points=100)
        assert len(curve) > 50  # Should get most of the 100 points

    def test_curve_is_closed(self):
        """For a Grashof mechanism, the coupler curve should be approximately closed."""
        mech = FourBar(a1=10, a2=3, a3=8, a4=7, p=5.0, alpha=0.0,
                        pivot_a=(0, 0), pivot_d=(10, 0))
        curve = generate_coupler_curve_four_bar(mech, n_points=360, theta_start=0, theta_end=360)
        if len(curve) >= 300:
            # First and last points should be close
            dist = np.sqrt((curve[0, 0] - curve[-1, 0])**2 + (curve[0, 1] - curve[-1, 1])**2)
            assert dist < 1.0

    def test_empty_for_invalid(self):
        mech = FourBar(a1=100, a2=1, a3=1, a4=1, pivot_a=(0, 0), pivot_d=(100, 0))
        curve = generate_coupler_curve_four_bar(mech, n_points=36)
        assert len(curve) == 0
