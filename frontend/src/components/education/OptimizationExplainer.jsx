/**
 * Optimization algorithms explainer — conceptual overview of DE, GA, PSO, SA.
 */
export default function OptimizationExplainer() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-amber-400">Optimization Algorithms</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        Analytical methods (Freudenstein, Burmester) can match 3–5 precision points exactly,
        but real curves have 50–100+ points. <strong>Global optimization</strong> searches the
        entire design space to minimize the error across all points simultaneously.
      </p>

      {/* Objective function */}
      <div className="card p-3">
        <p className="label mb-1.5">Objective Function (What We Minimize)</p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)]">
          <p className="mono text-xs text-[var(--color-text-secondary)] text-center">
            f(x) = (1/N) · Σ min_j [(P_x^j − D_x^k)² + (P_y^j − D_y^k)²]
          </p>
        </div>
        <p className="text-2xs text-[var(--color-text-muted)] mt-1">
          For each desired point D_k, find the closest point P_j on the actual coupler curve.
          Average the squared distances. This is the <strong>closest-point error metric</strong>.
        </p>
      </div>

      {/* Algorithm cards */}
      <div className="space-y-2">
        {ALGORITHMS.map(({ id, name, color, icon, description, steps }) => (
          <div key={id} className="card p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{icon}</span>
              <h4 className={`text-xs font-semibold ${color}`}>{name}</h4>
            </div>
            <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed mb-2">
              {description}
            </p>
            <div className="space-y-0.5">
              {steps.map((step, i) => (
                <p key={i} className="text-2xs text-[var(--color-text-muted)] pl-3 relative">
                  <span className="absolute left-0 text-[var(--color-text-muted)]">{i + 1}.</span>
                  {step}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison */}
      <div className="card p-3">
        <p className="label mb-1.5">When to Use Which</p>
        <div className="space-y-1 text-2xs text-[var(--color-text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--color-text-secondary)]">DE (recommended default):</strong>{' '}
            Best balance of exploration and exploitation. Robust for mechanism synthesis.
            Multi-seed runs prevent getting stuck in local optima.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">GA:</strong>{' '}
            Good when the design space is very large or highly discontinuous.
            Crossover can combine good partial solutions.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">PSO:</strong>{' '}
            Fast convergence for smooth fitness landscapes. Can struggle
            with many constraints.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">SA:</strong>{' '}
            Simple, single-solution approach. Good for fine-tuning, less effective
            as a standalone global search on high-dimensional problems.
          </p>
        </div>
      </div>

      {/* Constraints note */}
      <div className="p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
        <p className="text-2xs text-amber-300/70 leading-relaxed">
          <strong>Constraints are penalties:</strong> Grashof condition, transmission angle,
          and assembly feasibility are enforced as penalty terms added to the objective.
          Infeasible solutions get a large penalty, pushing the optimizer toward valid mechanisms.
        </p>
      </div>
    </div>
  );
}

const ALGORITHMS = [
  {
    id: 'de',
    name: 'Differential Evolution (DE)',
    color: 'text-emerald-400',
    icon: '🧬',
    description: 'Population-based: maintains a pool of candidate solutions. Creates new candidates by combining differences between existing ones.',
    steps: [
      'Initialize random population of mechanism parameters',
      'For each candidate, create a mutant by combining 3 other candidates',
      'Crossover: mix mutant genes with the original',
      'Select: keep whichever (original or trial) has lower error',
      'Repeat for many generations; refine best with Nelder-Mead',
    ],
  },
  {
    id: 'ga',
    name: 'Genetic Algorithm (GA)',
    color: 'text-blue-400',
    icon: '🧪',
    description: 'Mimics biological evolution: selection of the fittest, crossover (mating), and random mutation.',
    steps: [
      'Initialize random population of "chromosomes" (parameter vectors)',
      'Evaluate fitness (error) of each individual',
      'Select parents via tournament or roulette wheel (lower error = more likely)',
      'Crossover: combine parent genes to create children',
      'Mutation: randomly perturb some genes; keep elite individuals',
    ],
  },
  {
    id: 'pso',
    name: 'Particle Swarm Optimization (PSO)',
    color: 'text-purple-400',
    icon: '🐦',
    description: 'Simulates a swarm of particles flying through the design space, attracted toward the best-known positions.',
    steps: [
      'Initialize particles with random positions and velocities',
      'Each particle tracks its personal best position (p_best)',
      'The swarm tracks the global best position (g_best)',
      'Update velocity: inertia + pull toward p_best + pull toward g_best',
      'Update position; repeat until convergence',
    ],
  },
  {
    id: 'sa',
    name: 'Simulated Annealing (SA)',
    color: 'text-pink-400',
    icon: '🔥',
    description: 'Mimics metal cooling: starts "hot" (accepting worse solutions) and gradually "cools" (becoming greedy).',
    steps: [
      'Start with a random solution and high temperature T',
      'Generate a neighbor by small random perturbation',
      'If neighbor is better, always accept it',
      'If worse, accept with probability exp(−ΔE / T) (Metropolis criterion)',
      'Reduce T gradually (cooling schedule); restart if stuck',
    ],
  },
];
