import { Check, X, Minus } from 'lucide-react';

const TOOLS = [
  { name: 'Zxynth', highlight: true },
  { name: 'PMKS+' },
  { name: 'MotionGen Pro' },
  { name: 'SAM' },
  { name: 'SALAR' },
];

const FEATURES = [
  {
    category: 'Synthesis',
    items: [
      { feature: 'Path Generation', values: ['yes', 'no', 'yes', 'yes', 'yes'] },
      { feature: 'Function Generation', values: ['yes', 'no', 'no', 'yes', 'no'] },
      { feature: 'Motion Generation', values: ['yes', 'no', 'yes', 'yes', 'no'] },
      { feature: 'SVG/CSV Upload', values: ['yes', 'no', 'no', 'no', 'no'] },
      { feature: 'Freehand Drawing', values: ['yes', 'no', 'yes', 'no', 'no'] },
      { feature: 'Analytical + Optimization', values: ['yes', 'no', 'partial', 'yes', 'yes'] },
    ],
  },
  {
    category: 'Mechanisms',
    items: [
      { feature: '4-Bar Linkage', values: ['yes', 'yes', 'yes', 'yes', 'yes'] },
      { feature: '6-Bar (Watt & Stephenson)', values: ['yes', 'yes', 'no', 'yes', 'no'] },
      { feature: 'Slider-Crank', values: ['yes', 'yes', 'no', 'yes', 'no'] },
      { feature: 'Roberts-Chebyshev Cognates', values: ['yes', 'no', 'no', 'no', 'no'] },
      { feature: 'Kinematic Inversion', values: ['yes', 'no', 'no', 'partial', 'no'] },
    ],
  },
  {
    category: 'Optimization',
    items: [
      { feature: 'Differential Evolution', values: ['yes', 'no', 'no', 'partial', 'yes'] },
      { feature: 'Genetic Algorithm', values: ['yes', 'no', 'no', 'yes', 'yes'] },
      { feature: 'Particle Swarm (PSO)', values: ['yes', 'no', 'no', 'no', 'yes'] },
      { feature: 'Simulated Annealing', values: ['yes', 'no', 'no', 'no', 'yes'] },
      { feature: 'User-Selectable Algorithm', values: ['yes', 'no', 'no', 'no', 'yes'] },
    ],
  },
  {
    category: 'Output & Export',
    items: [
      { feature: 'Animated Visualization', values: ['yes', 'yes', 'yes', 'yes', 'no'] },
      { feature: 'Educational Walkthrough', values: ['yes', 'partial', 'no', 'no', 'no'] },
      { feature: 'PDF Report', values: ['yes', 'no', 'no', 'no', 'no'] },
      { feature: 'GIF Export', values: ['yes', 'no', 'no', 'no', 'no'] },
      { feature: 'DXF/SVG CAD Export', values: ['yes', 'no', 'no', 'partial', 'no'] },
    ],
  },
  {
    category: 'Access',
    items: [
      { feature: 'Web-Based (Free)', values: ['yes', 'yes', 'yes', 'no', 'no'] },
      { feature: 'No Install Required', values: ['yes', 'yes', 'yes', 'no', 'no'] },
      { feature: 'Open Source', values: ['no', 'yes', 'no', 'no', 'yes'] },
    ],
  },
];

function StatusIcon({ value }) {
  if (value === 'yes') return <Check size={15} className="text-emerald-400" />;
  if (value === 'no') return <X size={15} className="text-red-400/60" />;
  return <Minus size={15} className="text-amber-400/70" />;
}

export default function ToolComparison() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="label text-blueprint-400 mb-2">Feature Comparison</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            How Zxynth Compares
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            A comprehensive comparison against leading mechanism design tools.
          </p>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header */}
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)] w-[240px]">
                    Feature
                  </th>
                  {TOOLS.map(({ name, highlight }) => (
                    <th
                      key={name}
                      className={`px-4 py-3 text-center font-semibold w-[140px] ${
                        highlight
                          ? 'text-blueprint-400 bg-blueprint-500/5'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {FEATURES.map(({ category, items }) => (
                  <>
                    {/* Category header row */}
                    <tr key={`cat-${category}`} className="bg-[var(--color-bg-input)]/50">
                      <td
                        colSpan={TOOLS.length + 1}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
                      >
                        {category}
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {items.map(({ feature, values }) => (
                      <tr
                        key={feature}
                        className="border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-bg-input)]/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                          {feature}
                        </td>
                        {values.map((val, i) => (
                          <td
                            key={i}
                            className={`px-4 py-2.5 text-center ${
                              i === 0 ? 'bg-blueprint-500/5' : ''
                            }`}
                          >
                            <div className="flex justify-center">
                              <StatusIcon value={val} />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-2xs text-[var(--color-text-muted)] text-center mt-4">
          Comparison based on publicly available documentation as of 2026. "Partial" indicates limited or
          conditional support. PMKS+ is analysis-focused (not synthesis). SAM is commercial desktop software.
          SALAR is an open-source MATLAB tool for path synthesis only.
        </p>
      </div>
    </section>
  );
}
