/**
 * Loop-closure equation explainer with vector diagram.
 */
export default function LoopClosureExplainer() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-purple-400">Loop-Closure Equation</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        The <strong>loop-closure equation</strong> is the fundamental constraint that links
        in a closed kinematic chain must satisfy. It states that the vector sum around any
        closed loop must equal zero.
      </p>

      {/* Vector diagram */}
      <div className="card p-3">
        <p className="label mb-2">4-Bar Vector Loop</p>
        <svg viewBox="0 0 260 160" className="w-full" style={{ maxHeight: 160 }}>
          {/* Ground A→D */}
          <line x1="40" y1="120" x2="200" y2="120" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 3" />
          {/* Crank A→B */}
          <line x1="40" y1="120" x2="90" y2="50" stroke="#60a5fa" strokeWidth="2" />
          {/* Coupler B→C */}
          <line x1="90" y1="50" x2="190" y2="40" stroke="#34d399" strokeWidth="2" />
          {/* Rocker D→C */}
          <line x1="200" y1="120" x2="190" y2="40" stroke="#60a5fa" strokeWidth="2" />

          {/* Vector arrows */}
          <defs>
            <marker id="lc-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>
          </defs>

          {/* r₂ arrow */}
          <line x1="42" y1="118" x2="86" y2="54" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#lc-arrow)" opacity="0.7" />
          <text x="48" y="80" fontSize="10" fill="#f59e0b" fontFamily="JetBrains Mono">r₂</text>

          {/* r₃ arrow */}
          <line x1="92" y1="52" x2="186" y2="43" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#lc-arrow)" opacity="0.7" />
          <text x="135" y="38" fontSize="10" fill="#f59e0b" fontFamily="JetBrains Mono">r₃</text>

          {/* r₄ arrow (D→C direction) */}
          <line x1="198" y1="118" x2="192" y2="44" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#lc-arrow)" opacity="0.7" />
          <text x="205" y="80" fontSize="10" fill="#f59e0b" fontFamily="JetBrains Mono">r₄</text>

          {/* r₁ arrow */}
          <line x1="42" y1="122" x2="196" y2="122" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#lc-arrow)" opacity="0.7" />
          <text x="115" y="140" fontSize="10" fill="#f59e0b" fontFamily="JetBrains Mono">r₁</text>

          {/* Joint labels */}
          <text x="28" y="130" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">A</text>
          <text x="85" y="42" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">B</text>
          <text x="192" y="32" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">C</text>
          <text x="204" y="130" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">D</text>

          {/* Angle arcs */}
          <path d="M 55 120 A 15 15 0 0 0 48 108" fill="none" stroke="#60a5fa" strokeWidth="1" />
          <text x="56" y="112" fontSize="8" fill="#60a5fa">θ₂</text>
        </svg>
      </div>

      {/* Vector equation */}
      <div className="card p-3 text-center space-y-2">
        <p className="label">Vector Form</p>
        <p className="mono text-sm text-[var(--color-text-secondary)]">
          r⃗₂ + r⃗₃ = r⃗₁ + r⃗₄
        </p>
      </div>

      {/* Component equations */}
      <div className="card p-3 space-y-2">
        <p className="label">Scalar Components (x and y)</p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)] mono text-xs space-y-1.5 text-[var(--color-text-secondary)]">
          <p>
            <span className="text-blue-400">x:</span>{' '}
            a₂·cos(θ₂) + a₃·cos(θ₃) = a₁·cos(θ₁) + a₄·cos(θ₄)
          </p>
          <p>
            <span className="text-pink-400">y:</span>{' '}
            a₂·sin(θ₂) + a₃·sin(θ₃) = a₁·sin(θ₁) + a₄·sin(θ₄)
          </p>
        </div>
      </div>

      {/* Complex form */}
      <div className="card p-3 space-y-2">
        <p className="label">Complex Exponential Form</p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)]">
          <p className="mono text-xs text-[var(--color-text-secondary)] text-center">
            a₂·e^(iθ₂) + a₃·e^(iθ₃) = a₁·e^(iθ₁) + a₄·e^(iθ₄)
          </p>
        </div>
        <p className="text-2xs text-[var(--color-text-muted)]">
          The complex form is compact and powerful for analytical derivations.
          Each vector r⃗ = a·e^(iθ) represents magnitude and direction.
        </p>
      </div>

      {/* Usage note */}
      <div className="p-2 rounded-md bg-purple-500/5 border border-purple-500/10">
        <p className="text-2xs text-purple-300/70 leading-relaxed">
          <strong>Key insight:</strong> Given θ₂ (input) and all link lengths (a₁–a₄),
          the loop-closure equation gives 2 scalar equations in 2 unknowns (θ₃, θ₄).
          Solving these yields the position of every link — this is <em>forward kinematics</em>.
        </p>
      </div>
    </div>
  );
}
