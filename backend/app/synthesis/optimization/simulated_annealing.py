"""
Simulated Annealing (SA) Optimizer

Single-solution stochastic optimizer inspired by the metallurgical
annealing process. Starts "hot" (accepting worse solutions frequently)
and gradually "cools" (becoming greedy), allowing escape from local optima.

Algorithm:
1. Start with random solution x, temperature T = T_initial
2. Generate neighbor x' by Gaussian perturbation
3. If f(x') < f(x): accept x' (always)
4. If f(x') ≥ f(x): accept with probability exp(-(f(x')-f(x)) / T) (Metropolis)
5. Cool: T = T * cooling_rate
6. If no improvement for restart_threshold steps: restart from global best
7. Repeat until max_iterations
"""

import numpy as np
from typing import Dict, Optional, Callable
import time

from .objective import path_objective, path_objective_with_timing, function_objective, motion_objective
from .constraints import compute_total_penalty
from .bounds import get_bounds


def run_sa_optimization(
    problem_type: str,
    mechanism_type: str,
    desired_data: np.ndarray,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Run Simulated Annealing optimization.

    Returns:
        dict with 'best_vector', 'best_fitness', 'generations', 'elapsed',
        'acceptance_rate', 'num_restarts'
    """
    max_iter = hyperparams.get("maxGenerations", 50000)
    initial_temp = hyperparams.get("initialTemp", 1000.0)
    cooling_rate = hyperparams.get("coolingRate", 0.995)
    restart_threshold = hyperparams.get("restartThreshold", 1000)

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

    # Initialize
    current = np.random.uniform(lower, upper)
    current_fitness = evaluate(current)

    best = current.copy()
    best_fitness = current_fitness

    temperature = initial_temp
    no_improve_count = 0
    num_restarts = 0
    accepted = 0
    total_trials = 0

    start_time = time.time()

    # Adaptive step size: starts large, decreases with temperature
    base_sigma = param_range * 0.1

    for iteration in range(max_iter):
        # Generate neighbor via Gaussian perturbation
        # Step size scales with temperature
        temp_ratio = temperature / initial_temp
        sigma = base_sigma * max(0.01, temp_ratio)

        neighbor = current + np.random.normal(0, sigma)
        neighbor = np.clip(neighbor, lower, upper)

        neighbor_fitness = evaluate(neighbor)
        total_trials += 1

        # Metropolis acceptance criterion
        delta = neighbor_fitness - current_fitness

        if delta < 0:
            # Better solution: always accept
            current = neighbor
            current_fitness = neighbor_fitness
            accepted += 1
        else:
            # Worse solution: accept with probability exp(-delta/T)
            if temperature > 1e-10:
                prob = np.exp(-delta / temperature)
                if np.random.random() < prob:
                    current = neighbor
                    current_fitness = neighbor_fitness
                    accepted += 1

        # Update global best
        if current_fitness < best_fitness:
            best = current.copy()
            best_fitness = current_fitness
            no_improve_count = 0
        else:
            no_improve_count += 1

        # Restart from best if stagnated
        if no_improve_count >= restart_threshold:
            current = best.copy() + np.random.normal(0, base_sigma * 0.05)
            current = np.clip(current, lower, upper)
            current_fitness = evaluate(current)
            no_improve_count = 0
            num_restarts += 1
            # Reheat slightly
            temperature = max(temperature, initial_temp * 0.1)

        # Cool down
        temperature *= cooling_rate

        # Progress callback (every 500 iterations to avoid overhead)
        if progress_callback and iteration % 500 == 0:
            # Map SA iterations to "generations" for the UI
            gen_equiv = int((iteration / max_iter) * hyperparams.get("maxGenerations", 400))
            progress_callback(gen_equiv, float(best_fitness))

    elapsed = time.time() - start_time
    acceptance_rate = accepted / max(1, total_trials)

    if progress_callback:
        progress_callback(hyperparams.get("maxGenerations", 400), float(best_fitness))

    return {
        "best_vector": best.tolist(),
        "best_fitness": float(best_fitness),
        "generations": max_iter,
        "elapsed": round(elapsed, 2),
        "acceptance_rate": round(acceptance_rate, 4),
        "num_restarts": num_restarts,
        "final_temperature": float(temperature),
    }
