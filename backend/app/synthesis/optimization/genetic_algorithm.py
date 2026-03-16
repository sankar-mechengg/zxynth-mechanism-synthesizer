"""
Genetic Algorithm (GA) Optimizer

Population-based evolutionary optimizer that mimics biological evolution:
1. Initialize random population of chromosomes (parameter vectors)
2. Evaluate fitness (penalized objective)
3. Select parents via tournament selection
4. Crossover: blend parent genes to create children (SBX crossover)
5. Mutation: Gaussian perturbation of random genes
6. Elitism: keep the best individual unchanged
7. Repeat for max_generations
"""

import numpy as np
from typing import Dict, Optional, Callable
import time

from .objective import path_objective, path_objective_with_timing, function_objective, motion_objective
from .constraints import compute_total_penalty
from .bounds import get_bounds


def run_ga_optimization(
    problem_type: str,
    mechanism_type: str,
    desired_data: np.ndarray,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Run Genetic Algorithm optimization.

    Returns:
        dict with 'best_vector', 'best_fitness', 'generations', 'elapsed'
    """
    pop_size = hyperparams.get("populationSize", 100)
    max_gen = hyperparams.get("maxGenerations", 400)
    crossover_rate = hyperparams.get("crossoverRate", 0.8)
    mutation_rate = hyperparams.get("mutationRate", 0.05)
    elite_count = max(1, pop_size // 20)  # Top 5% are elite

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

    # Initialize population
    population = np.random.uniform(lower, upper, (pop_size, n_params))
    fitness = np.array([evaluate(ind) for ind in population])

    best_idx = np.argmin(fitness)
    best_vector = population[best_idx].copy()
    best_fitness = fitness[best_idx]

    start_time = time.time()

    for gen in range(max_gen):
        # Sort by fitness
        sorted_idx = np.argsort(fitness)
        population = population[sorted_idx]
        fitness = fitness[sorted_idx]

        new_population = np.zeros_like(population)

        # Elitism: keep top individuals
        new_population[:elite_count] = population[:elite_count]

        # Generate offspring
        for i in range(elite_count, pop_size):
            # Tournament selection (size 3)
            p1 = _tournament_select(population, fitness, 3)
            p2 = _tournament_select(population, fitness, 3)

            # SBX Crossover
            if np.random.random() < crossover_rate:
                child = _sbx_crossover(p1, p2, lower, upper, eta=2.0)
            else:
                child = p1.copy() if np.random.random() < 0.5 else p2.copy()

            # Gaussian mutation
            for j in range(n_params):
                if np.random.random() < mutation_rate:
                    sigma = param_range[j] * 0.1 * (1.0 - gen / max_gen)  # Decreasing sigma
                    child[j] += np.random.normal(0, sigma)

            # Clamp to bounds
            child = np.clip(child, lower, upper)
            new_population[i] = child

        population = new_population
        fitness = np.array([evaluate(ind) for ind in population])

        # Track best
        gen_best_idx = np.argmin(fitness)
        if fitness[gen_best_idx] < best_fitness:
            best_fitness = fitness[gen_best_idx]
            best_vector = population[gen_best_idx].copy()

        if progress_callback and gen % 5 == 0:
            progress_callback(gen + 1, float(best_fitness))

    elapsed = time.time() - start_time

    if progress_callback:
        progress_callback(max_gen, float(best_fitness))

    return {
        "best_vector": best_vector.tolist(),
        "best_fitness": float(best_fitness),
        "generations": max_gen,
        "elapsed": round(elapsed, 2),
    }


def _tournament_select(population, fitness, tournament_size):
    """Select individual via tournament selection."""
    idx = np.random.choice(len(population), tournament_size, replace=False)
    best = idx[np.argmin(fitness[idx])]
    return population[best].copy()


def _sbx_crossover(p1, p2, lower, upper, eta=2.0):
    """Simulated Binary Crossover (SBX)."""
    child = np.zeros_like(p1)
    for i in range(len(p1)):
        if np.random.random() < 0.5:
            if abs(p1[i] - p2[i]) > 1e-14:
                if p1[i] < p2[i]:
                    y1, y2 = p1[i], p2[i]
                else:
                    y1, y2 = p2[i], p1[i]

                rand = np.random.random()
                beta = 1.0 + (2.0 * (y1 - lower[i]) / (y2 - y1 + 1e-14))
                alpha = 2.0 - beta ** (-(eta + 1.0))
                if rand <= 1.0 / alpha:
                    betaq = (rand * alpha) ** (1.0 / (eta + 1.0))
                else:
                    betaq = (1.0 / (2.0 - rand * alpha)) ** (1.0 / (eta + 1.0))
                child[i] = 0.5 * ((1 + betaq) * y1 + (1 - betaq) * y2)
            else:
                child[i] = p1[i]
        else:
            child[i] = p1[i] if np.random.random() < 0.5 else p2[i]

    return np.clip(child, lower, upper)
