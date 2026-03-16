/**
 * Transmission angle explainer with mechanism diagram and practical guidelines.
 */
export default function TransmissionAngleExplainer() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-pink-400">Transmission Angle</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        The <strong>transmission angle (μ)</strong> measures how effectively force is transmitted
        from the input through the coupler to the output. It is the angle between the coupler
        link and the output link at their shared joint.
      </p>

      {/* Diagram */}
      <div className="card p-3">
        <p className="label mb-2">Transmission Angle on a 4-Bar</p>
        <svg viewBox="0 0 260 150" className="w-full" style={{ maxHeight: 150 }}>
          {/* Ground */}
          <line x1="40" y1="110" x2="200" y2="110" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 3" />

          {/* Links */}
          <line x1="40" y1="110" x2="80" y2="45" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="45" x2="175" y2="35" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="200" y1="110" x2="175" y2="35" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />

          {/* Transmission angle arc at joint C (coupler-rocker joint) */}
          <path d="M 165 45 A 20 20 0 0 1 180 55" fill="none" stroke="#f472b6" strokeWidth="2" />
          <text x="155" y="62" fontSize="11" fill="#f472b6" fontWeight="600"
            fontFamily="JetBrains Mono, monospace">μ</text>

          {/* Extension lines to show the angle */}
          <line x1="175" y1="35" x2="155" y2="50" stroke="#f472b6" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
          <line x1="175" y1="35" x2="185" y2="55" stroke="#f472b6" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />

          {/* Joint markers */}
          <circle cx="40" cy="110" r="4" fill="#f59e0b" />
          <circle cx="200" cy="110" r="4" fill="#f59e0b" />
          <circle cx="80" cy="45" r="4" fill="#60a5fa" />
          <circle cx="175" cy="35" r="5" fill="#f472b6" stroke="var(--color-bg-primary)" strokeWidth="2" />

          {/* Labels */}
          <text x="28" y="122" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">A</text>
          <text x="72" y="38" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">B</text>
          <text x="178" y="28" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">C</text>
          <text x="204" y="122" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">D</text>

          {/* Link labels */}
          <text x="48" y="75" fontSize="9" fill="#60a5fa" fontFamily="JetBrains Mono">a₂</text>
          <text x="120" y="32" fontSize="9" fill="#34d399" fontFamily="JetBrains Mono">a₃</text>
          <text x="200" y="72" fontSize="9" fill="#60a5fa" fontFamily="JetBrains Mono">a₄</text>
          <text x="115" y="122" fontSize="9" fill="#94a3b8" fontFamily="JetBrains Mono">a₁</text>
        </svg>
      </div>

      {/* Formula */}
      <div className="card p-3 text-center space-y-2">
        <p className="label">Formula</p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)]">
          <p className="mono text-xs text-[var(--color-text-secondary)]">
            cos(μ) = (a₃² + a₄² − a₁² − a₂² + 2·a₁·a₂·cos(θ₂)) / (2·a₃·a₄)
          </p>
        </div>
        <p className="text-2xs text-[var(--color-text-muted)]">
          μ varies as the crank rotates. We care about the <strong>minimum μ</strong> over the full cycle.
        </p>
      </div>

      {/* Practical guidelines */}
      <div>
        <p className="label mb-1.5">Practical Guidelines</p>
        <div className="space-y-1.5">
          {[
            { range: 'μ ≥ 40°', status: 'Good', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', desc: 'Excellent force transmission. Smooth, efficient operation.' },
            { range: '30° ≤ μ < 40°', status: 'Marginal', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', desc: 'Acceptable but may cause slight jerkiness. Monitor under load.' },
            { range: 'μ < 30°', status: 'Poor', color: 'text-red-400 border-red-500/20 bg-red-500/5', desc: 'High friction, risk of jamming. Avoid in practice.' },
            { range: 'μ = 0° or 180°', status: 'Lock-up', color: 'text-red-400 border-red-500/20 bg-red-500/5', desc: 'Mechanism cannot transmit any force — dead position.' },
          ].map(({ range, status, color, desc }) => (
            <div key={range} className={`p-2 rounded-md border ${color}`}>
              <div className="flex items-center justify-between">
                <span className="mono text-xs font-medium">{range}</span>
                <span className="text-2xs font-bold">{status}</span>
              </div>
              <p className="text-2xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Extremes */}
      <div className="card p-3">
        <p className="label mb-1.5">Extremes During a Full Cycle</p>
        <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
          The minimum transmission angle occurs at one of two crank positions where
          θ₂ = 0° or θ₂ = 180° (when the crank is aligned with the ground link).
          These are the <strong>toggle positions</strong> — the mechanism is closest to
          locking at these points.
        </p>
      </div>

      {/* Connection to design */}
      <div className="p-2 rounded-md bg-pink-500/5 border border-pink-500/10">
        <p className="text-2xs text-pink-300/70 leading-relaxed">
          <strong>Design impact:</strong> A minimum transmission angle constraint
          (typically μ_min ≥ 40°) is enforced during optimization as a penalty.
          This ensures the synthesized mechanism is not just mathematically optimal
          but also physically viable.
        </p>
      </div>
    </div>
  );
}
