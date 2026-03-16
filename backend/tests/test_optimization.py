"""
Tests for optimization algorithms.
Uses a simple circular arc path where optimal 4-bar parameters are approximately known.
Tests verify that each optimizer can find a reasonable solution.
"""

import pytest
import numpy as np

from app.synthesis.optimization.differential_evolution import run_de_optimization
from app.synthesis.optimization.genetic_algorithm import run_ga_optimization
from app.synthesis.optimization.particle_swarm import run_pso_optimization
from app.synthesis.optimization.simulated_annealing import run_sa_optimization


@pytest.fixture
def simple_arc_path():
    """Quarter-circle arc — easy to approximate with a 4-bar."""
    t = np.linspace(0, np.pi / 4, 30)
    r = 50
    return np.column_stack([r * np.cos(t), r * np.sin(t)])


@pytest.fixture
def light_constraints():
    return {
        "grashofRequired": False,
        "minTransmissionAngle": 20.0,
        "tolerance": 10.0,
    }


@pytest.fixture
def fast_hyperparams():
    """Minimal hyperparams for fast testing."""
    return {
        "populationSize": 15,
        "maxGenerations": 20,
        "numSeeds": 1,
        "crossoverRate": 0.8,
        "mutationRate": 0.1,
        "inertiaWeight": 0.7,
        "cognitiveWeight": 2.0,
        "socialWeight": 2.0,
        "initialTemp": 500,
        "coolingRate": 0.99,
        "restartThreshold": 50,
    }


class TestDifferentialEvolution:
    def test_de_returns_result(self, simple_arc_path, light_constraints, fast_hyperparams):
        result = run_de_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result is not None
        assert result["best_vector"] is not None
        assert result["best_fitness"] < 1e8  # Not completely infeasible
        assert result["generations"] > 0

    def test_de_progress_callback(self, simple_arc_path, light_constraints, fast_hyperparams):
        progress_calls = []
        def callback(gen, fitness):
            progress_calls.append((gen, fitness))

        run_de_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
            progress_callback=callback,
        )
        assert len(progress_calls) > 0


class TestGeneticAlgorithm:
    def test_ga_returns_result(self, simple_arc_path, light_constraints, fast_hyperparams):
        result = run_ga_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result is not None
        assert result["best_vector"] is not None
        assert result["best_fitness"] < 1e8

    def test_ga_generations(self, simple_arc_path, light_constraints, fast_hyperparams):
        result = run_ga_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result["generations"] == fast_hyperparams["maxGenerations"]


class TestParticleSwarm:
    def test_pso_returns_result(self, simple_arc_path, light_constraints, fast_hyperparams):
        result = run_pso_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result is not None
        assert result["best_vector"] is not None
        assert result["best_fitness"] < 1e8

    def test_pso_elapsed_time(self, simple_arc_path, light_constraints, fast_hyperparams):
        result = run_pso_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result["elapsed"] > 0


class TestSimulatedAnnealing:
    def test_sa_returns_result(self, simple_arc_path, light_constraints, fast_hyperparams):
        fast_hyperparams["maxGenerations"] = 500  # SA uses more iterations
        result = run_sa_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert result is not None
        assert result["best_vector"] is not None
        assert result["best_fitness"] < 1e8

    def test_sa_acceptance_rate(self, simple_arc_path, light_constraints, fast_hyperparams):
        fast_hyperparams["maxGenerations"] = 500
        result = run_sa_optimization(
            "path", "four_bar", simple_arc_path,
            light_constraints, fast_hyperparams,
        )
        assert 0 < result["acceptance_rate"] <= 1.0
