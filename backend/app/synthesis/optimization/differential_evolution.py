"""
Differential Evolution (DE) Optimizer

The recommended default optimizer for mechanism synthesis.
Uses scipy.optimize.differential_evolution with multi-seed runs
and Nelder-Mead local refinement of the best result.

DE is a population-based global optimization algorithm that:
1. Initializes a random population
2. Creates mutant vectors by combining differences of existing vectors
3. Crossovers mutant with target vector
4. Selects the better of target and trial

Multi-seed: runs DE multiple times with different random seeds,
keeps the best result across all runs. This reduces the chance
of getting stuck in a local optimum.

Nelder-Mead refinement: after DE converges, runs Nelder-Mead
(simplex) local optimizer starting from the DE best, which can
squeeze out additional improvement in the local basin.
"""

import numpy as np
from scipy.optimize import differential_evolution, minimize
from typing import Dict, Optional, Callable, Tuple
import time

from .objective import path_objective, path_objective_with_timing, function_objective, motion_objective
from .constraints import compute_total_penalty
from .bounds import get_bounds


def run_de_optimization(
    problem_type: str,
    mechanism_type: str,
    desired_data: np.ndarray,
    constraints: Dict,
    hyperparams: Dict,
    progress_callback: Optional[Callable] = None,
    timing_map: list = None,
) -> Dict:
    """
    Run Differential Evolution optimization with multi-seed and Nelder-Mead.

    Args:
        problem_type: 'path', 'function', or 'motion'
        mechanism_type: mechanism type string
        desired_data: desired path/pairs/poses as numpy array
        constraints: constraint parameters dict
        hyperparams: DE hyperparameters
        progress_callback: called with (generation, best_fitness)
        timing_map: optional timing constraints for prescribed-timing path gen

    Returns:
        dict with 'best_vector', 'best_fitness', 'generations', 'elapsed', 'all_seeds'
    """
    pop_size = hyperparams.get("populationSize", 100)
    max_gen = hyperparams.get("maxGenerations", 400)
    num_seeds = hyperparams.get("numSeeds", 6)

    # Get bounds
    lower, upper = get_bounds(mechanism_type, desired_data)
    bounds_list = list(zip(lower, upper))

    # Build penalized objective
    grashof_req = constraints.get("grashofRequired", True)
    min_trans = constraints.get("minTransmissionAngle", 40.0)

    def penalized_objective(x):
        # Raw objective
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

        # Constraint penalty
        penalty = compute_total_penalty(
            x, mechanism_type,
            grashof_required=grashof_req,
            min_transmission_angle=min_trans,
        )

        return obj + penalty

    # Multi-seed DE runs
    best_result = None
    best_fitness = float("inf")
    all_seeds = []
    total_gen = 0
    start_time = time.time()

    for seed_idx in range(num_seeds):
        seed = seed_idx * 42 + 7  # Deterministic but varied seeds

        gen_counter = [0]

        def callback(xk, convergence=0):
            gen_counter[0] += 1
            current_gen = total_gen + gen_counter[0]
            fitness = penalized_objective(xk)
            if progress_callback:
                progress_callback(
                    current_gen,
                    min(fitness, best_fitness),
                )

        try:
            result = differential_evolution(
                penalized_objective,
                bounds_list,
                seed=seed,
                maxiter=max_gen // num_seeds,
                popsize=max(pop_size // 5, 10),
                tol=1e-10,
                mutation=(0.5, 1.5),
                recombination=0.8,
                strategy="best1bin",
                callback=callback,
                polish=False,  # We do our own Nelder-Mead
                disp=False,
            )

            seed_info = {
                "seed": seed,
                "fitness": float(result.fun),
                "generations": result.nit,
                "success": result.success,
            }
            all_seeds.append(seed_info)

            if result.fun < best_fitness:
                best_fitness = result.fun
                best_result = result

        except Exception as e:
            all_seeds.append({"seed": seed, "error": str(e)})

        total_gen += gen_counter[0]

    if best_result is None:
        return {
            "best_vector": None,
            "best_fitness": float("inf"),
            "generations": total_gen,
            "elapsed": time.time() - start_time,
            "all_seeds": all_seeds,
            "error": "All DE seeds failed",
        }

    # Nelder-Mead local refinement
    try:
        nm_result = minimize(
            penalized_objective,
            best_result.x,
            method="Nelder-Mead",
            options={
                "maxiter": 1000,
                "xatol": 1e-8,
                "fatol": 1e-8,
            },
        )

        if nm_result.fun < best_fitness:
            best_fitness = nm_result.fun
            best_vector = nm_result.x
        else:
            best_vector = best_result.x
    except Exception:
        best_vector = best_result.x

    elapsed = time.time() - start_time

    if progress_callback:
        progress_callback(max_gen, best_fitness)

    return {
        "best_vector": best_vector.tolist(),
        "best_fitness": float(best_fitness),
        "generations": total_gen,
        "elapsed": round(elapsed, 2),
        "all_seeds": all_seeds,
        "refined": True,
    }
