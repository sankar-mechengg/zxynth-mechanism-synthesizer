"""
Particle Swarm Optimization (PSO)

Swarm intelligence optimizer where particles fly through the design space,
attracted toward their personal best and the swarm's global best positions.

Update equations:
  v_i(t+1) = w·v_i(t) + c₁·r₁·(p_best_i - x_i) + c₂·r₂·(g_best - x_i)
  x_i(t+1) = x_i(t) + v_i(t+1)

Where:
  w = inertia weight (momentum)
  c₁ = cognitive weight (attraction to personal best)
  c₂ = social weight (attraction to global best)
  r₁, r₂ = random factors [0, 1]

Inertia weight linearly decreases from w_max to w_min over iterations,
shifting from exploration (high w) to exploitation (low w).
"""

import numpy as np
from typing import Dict, Optional, Callable
import time

from .objective import path_objective, path_objective_with_timing, function_objective, motion_objective
from .constraints import compute_total_penalty
from .bounds import get_bounds


def run_pso_optimization(
    problem_type: str,
    mechanism_type: str,
    desired_data: np.ndarray,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Run Particle Swarm Optimization.

    Returns:
        dict with 'best_vector', 'best_fitness', 'generations', 'elapsed'
    """
    swarm_size = hyperparams.get("populationSize", 50)
    max_iter = hyperparams.get("maxGenerations", 400)
    w_init = hyperparams.get("inertiaWeight", 0.9)
    c1 = hyperparams.get("cognitiveWeight", 2.0)
    c2 = hyperparams.get("socialWeight", 2.0)

    w_min = 0.4
    w_max = w_init

    lower, upper = get_bounds(mechanism_type, desired_data)
    n_params = len(lower)
    param_range = upper - lower

    grashof_req = constraints.get("grashofRequired", True)
    min_trans = constraints.get("minTransmissionAngle", 40.0)

    def evaluate(x):
        if problem_type == "path":
            if timing_map:
                obj = path_objective_with_timing(x, desired_data, timing_map, mechanism_type)
            else:
                obj = path_objective(x, desired_data, mechanism_type)
        elif problem_type == "function":
            obj = function_objective(x, desired_data, mechanism_type)
        elif problem_type == "motion":
            obj = motion_objective(x, desired_data, mechanism_type)
        else:
            obj = 1e10
        penalty = compute_total_penalty(x, mechanism_type, grashof_req, min_transmission_angle=min_trans)
        return obj + penalty

    # Initialize swarm
    positions = np.random.uniform(lower, upper, (swarm_size, n_params))
    velocities = np.random.uniform(
        -0.1 * param_range, 0.1 * param_range, (swarm_size, n_params)
    )

    # Velocity limits
    v_max = 0.2 * param_range

    # Evaluate initial fitness
    fitness = np.array([evaluate(p) for p in positions])

    # Personal best
    p_best = positions.copy()
    p_best_fitness = fitness.copy()

    # Global best
    g_best_idx = np.argmin(fitness)
    g_best = positions[g_best_idx].copy()
    g_best_fitness = float(fitness[g_best_idx])

    start_time = time.time()

    for iteration in range(max_iter):
        # Linearly decreasing inertia weight
        w = w_max - (w_max - w_min) * iteration / max_iter

        # Update velocities and positions
        r1 = np.random.random((swarm_size, n_params))
        r2 = np.random.random((swarm_size, n_params))

        cognitive = c1 * r1 * (p_best - positions)
        social = c2 * r2 * (g_best - positions)

        velocities = w * velocities + cognitive + social

        # Velocity clamping
        velocities = np.clip(velocities, -v_max, v_max)

        # Update positions
        positions = positions + velocities

        # Boundary handling: reflect off bounds
        for j in range(n_params):
            below = positions[:, j] < lower[j]
            above = positions[:, j] > upper[j]
            positions[below, j] = lower[j] + (lower[j] - positions[below, j]) * 0.5
            positions[above, j] = upper[j] - (positions[above, j] - upper[j]) * 0.5
            # Clamp as safety
            positions[:, j] = np.clip(positions[:, j], lower[j], upper[j])
            # Reverse velocity on reflection
            velocities[below, j] *= -0.5
            velocities[above, j] *= -0.5

        # Evaluate
        fitness = np.array([evaluate(p) for p in positions])

        # Update personal best
        improved = fitness < p_best_fitness
        p_best[improved] = positions[improved]
        p_best_fitness[improved] = fitness[improved]

        # Update global best
        gen_best_idx = np.argmin(p_best_fitness)
        if p_best_fitness[gen_best_idx] < g_best_fitness:
            g_best_fitness = float(p_best_fitness[gen_best_idx])
            g_best = p_best[gen_best_idx].copy()

        if progress_callback and iteration % 5 == 0:
            progress_callback(iteration + 1, g_best_fitness)

    elapsed = time.time() - start_time

    if progress_callback:
        progress_callback(max_iter, g_best_fitness)

    return {
        "best_vector": g_best.tolist(),
        "best_fitness": g_best_fitness,
        "generations": max_iter,
        "elapsed": round(elapsed, 2),
    }
