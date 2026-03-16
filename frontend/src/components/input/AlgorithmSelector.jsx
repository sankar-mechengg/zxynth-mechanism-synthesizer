import { ALGORITHMS } from '../../config/api';
import ParameterInput from '../common/ParameterInput';
import clsx from 'clsx';

/**
 * Algorithm selector with configurable hyperparameters per algorithm.
 *
 * @param {object} props
 * @param {string} props.algorithm - Selected algorithm id
 * @param {function} props.onAlgorithmChange - Called with algorithm id
 * @param {object} props.hyperparams - Current hyperparameters
 * @param {function} props.onHyperparamsChange - Called with partial hyperparams update
 * @param {string} [props.className]
 */

const HYPERPARAM_FIELDS = {
  de: [
    { key: 'populationSize', label: 'Population', min: 20, max: 500, step: 10, tooltip: 'Number of candidate solutions per generation' },
    { key: 'maxGenerations', label: 'Generations', min: 50, max: 2000, step: 50, tooltip: 'Maximum optimization iterations' },
    { key: 'numSeeds', label: 'Seeds', min: 1, max: 20, step: 1, tooltip: 'Number of independent runs; best result is kept' },
  ],
  ga: [
    { key: 'populationSize', label: 'Population', min: 20, max: 500, step: 10, tooltip: 'Number of individuals in each generation' },
    { key: 'maxGenerations', label: 'Generations', min: 50, max: 2000, step: 50, tooltip: 'Maximum number of generations' },
    { key: 'crossoverRate', label: 'Crossover Rate', min: 0.1, max: 1, step: 0.05, tooltip: 'Probability of crossover between parents (0.6–0.9 typical)' },
    { key: 'mutationRate', label: 'Mutation Rate', min: 0.001, max: 0.5, step: 0.01, tooltip: 'Probability of gene mutation (0.01–0.1 typical)' },
  ],
  pso: [
    { key: 'populationSize', label: 'Swarm Size', min: 10, max: 300, step: 10, tooltip: 'Number of particles in the swarm' },
    { key: 'maxGenerations', label: 'Iterations', min: 50, max: 2000, step: 50, tooltip: 'Maximum number of iterations' },
    { key: 'inertiaWeight', label: 'Inertia (w)', min: 0.1, max: 1.5, step: 0.05, tooltip: 'Controls momentum; 0.4–0.9 typical, linearly decreasing' },
    { key: 'cognitiveWeight', label: 'Cognitive (c₁)', min: 0.5, max: 3, step: 0.1, tooltip: 'Attraction toward personal best (1.5–2.5 typical)' },
    { key: 'socialWeight', label: 'Social (c₂)', min: 0.5, max: 3, step: 0.1, tooltip: 'Attraction toward global best (1.5–2.5 typical)' },
  ],
  sa: [
    { key: 'maxGenerations', label: 'Max Iterations', min: 1000, max: 100000, step: 1000, tooltip: 'Total number of evaluation steps' },
    { key: 'initialTemp', label: 'Initial Temp', min: 100, max: 10000, step: 100, tooltip: 'Starting temperature; higher = more exploration early on' },
    { key: 'coolingRate', label: 'Cooling Rate', min: 0.9, max: 0.9999, step: 0.001, tooltip: 'Temperature multiplier per step; 0.99–0.999 typical' },
    { key: 'restartThreshold', label: 'Restart After', min: 100, max: 10000, step: 100, tooltip: 'Restart from best if no improvement for this many steps' },
  ],
};

// Default hyperparams for each algorithm
const ALGO_DEFAULTS = {
  de: { populationSize: 100, maxGenerations: 400, numSeeds: 6 },
  ga: { populationSize: 100, maxGenerations: 400, crossoverRate: 0.8, mutationRate: 0.05 },
  pso: { populationSize: 50, maxGenerations: 400, inertiaWeight: 0.7, cognitiveWeight: 2.0, socialWeight: 2.0 },
  sa: { maxGenerations: 50000, initialTemp: 1000, coolingRate: 0.995, restartThreshold: 1000 },
};

export default function AlgorithmSelector({
  algorithm,
  onAlgorithmChange,
  hyperparams,
  onHyperparamsChange,
  className = '',
}) {
  const handleAlgoChange = (algoId) => {
    onAlgorithmChange(algoId);
    // Apply defaults for the new algorithm
    onHyperparamsChange(ALGO_DEFAULTS[algoId] || {});
  };

  const fields = HYPERPARAM_FIELDS[algorithm] || [];

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {/* Algorithm selection */}
      <div>
        <label className="label mb-1.5 block">Optimization Algorithm</label>
        <div className="grid grid-cols-2 gap-2">
          {ALGORITHMS.map((algo) => {
            const isSelected = algorithm === algo.id;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => handleAlgoChange(algo.id)}
                className={clsx(
                  'px-3 py-2 rounded-md text-left transition-all duration-150 border',
                  isSelected
                    ? 'border-blueprint-400 bg-blueprint-500/10 text-blueprint-400'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-text-muted)] text-[var(--color-text-secondary)]'
                )}
              >
                <p className="text-sm font-medium">{algo.label}</p>
                <p className="text-2xs text-[var(--color-text-muted)] mt-0.5">{algo.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hyperparameters */}
      {fields.length > 0 && (
        <div>
          <label className="label mb-1.5 block">Hyperparameters</label>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {fields.map((field) => (
              <ParameterInput
                key={field.key}
                label={field.label}
                value={hyperparams[field.key] ?? ALGO_DEFAULTS[algorithm]?.[field.key] ?? 0}
                onChange={(val) => onHyperparamsChange({ [field.key]: val })}
                min={field.min}
                max={field.max}
                step={field.step}
                tooltip={field.tooltip}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ALGO_DEFAULTS };
