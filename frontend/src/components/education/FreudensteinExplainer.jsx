/**
 * Freudenstein's Equation explainer.
 * Shows the foundational equation for function generation synthesis.
 */
export default function FreudensteinExplainer() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-blue-400">Freudenstein&apos;s Equation</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        Freudenstein&apos;s equation is the foundational analytical tool for <strong>function generation</strong>.
        It relates the input angle (θ₂), output angle (θ₄), and the three Freudenstein constants
        (R₁, R₂, R₃) which are functions of the link lengths.
      </p>

      {/* Main equation */}
      <div className="card p-3 text-center space-y-2">
        <p className="label">Freudenstein&apos;s Equation</p>
        <p className="mono text-sm text-[var(--color-text-secondary)]">
          R₁·cos(θ₂) − R₂·cos(θ₄) + R₃ = cos(θ₂ − θ₄)
        </p>
      </div>

      {/* Constants */}
      <div className="card p-3 space-y-2">
        <p className="label">Freudenstein Constants</p>
        <div className="space-y-1.5 mono text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold w-8">R₁</span>
            <span>= a₁ / a₄</span>
            <span className="text-2xs text-[var(--color-text-muted)] ml-2">(ground / rocker)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold w-8">R₂</span>
            <span>= a₁ / a₂</span>
            <span className="text-2xs text-[var(--color-text-muted)] ml-2">(ground / crank)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold w-8">R₃</span>
            <span>= (a₁² + a₂² + a₄² − a₃²) / (2·a₂·a₄)</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div>
        <p className="label mb-1.5">How It Works</p>
        <div className="space-y-2 text-2xs text-[var(--color-text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--color-text-secondary)]">Step 1:</strong>{' '}
            Choose 3 precision points — three specific (θ₂, θ₄) pairs where the
            mechanism must exactly match the desired function.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">Step 2:</strong>{' '}
            Substitute each pair into Freudenstein&apos;s equation. This gives 3 linear
            equations in the 3 unknowns R₁, R₂, R₃.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">Step 3:</strong>{' '}
            Solve the 3×3 linear system to find R₁, R₂, R₃.
          </p>
          <p>
            <strong className="text-[var(--color-text-secondary)]">Step 4:</strong>{' '}
            Back-substitute to find link length ratios. Choose one link length
            freely (e.g., a₁ = 1), then compute a₂, a₃, a₄.
          </p>
        </div>
      </div>

      {/* Precision points */}
      <div className="card p-3">
        <p className="label mb-1.5">Precision Points & Chebyshev Spacing</p>
        <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed mb-2">
          Placing precision points at Chebyshev-spaced locations minimizes the maximum
          error (structural error) between the precision points:
        </p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)]">
          <p className="mono text-xs text-[var(--color-text-secondary)] text-center">
            x_k = (a+b)/2 + (b−a)/2 · cos((2k−1)π / 2n)
          </p>
        </div>
        <p className="text-2xs text-[var(--color-text-muted)] mt-1">
          where [a, b] is the input range, n is the number of precision points,
          and k = 1, …, n.
        </p>
      </div>

      {/* Limitations */}
      <div className="p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
        <p className="text-2xs text-amber-300/70 leading-relaxed">
          <strong>Limitation:</strong> Freudenstein&apos;s equation gives exact match at 3 points only.
          For better overall fit, 4–5 precision points can be used (over-determined system solved
          via least-squares), or global optimization is needed.
        </p>
      </div>
    </div>
  );
}
