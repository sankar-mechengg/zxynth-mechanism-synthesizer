import { BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { formatNum, formatPercent } from '../../utils/formatUtils';

/**
 * Error metrics display with visual bar chart.
 *
 * @param {object} props
 * @param {object} props.metrics - { mean, max, rms, meanPercent, maxPercent, rmsPercent }
 * @param {number} [props.tolerance=5] - Tolerance threshold in %
 * @param {string} [props.className]
 */
export default function ErrorMetrics({ metrics, tolerance = 5, className = '' }) {
  if (!metrics) return null;

  const entries = [
    { key: 'mean', label: 'Mean Error', value: metrics.mean, pct: metrics.meanPercent, color: '#60a5fa' },
    { key: 'max', label: 'Max Error', value: metrics.max, pct: metrics.maxPercent, color: '#f59e0b' },
    { key: 'rms', label: 'RMS Error', value: metrics.rms, pct: metrics.rmsPercent, color: '#34d399' },
  ];

  const maxPct = Math.max(...entries.map((e) => e.pct || 0), tolerance);
  const allPass = entries.every((e) => e.pct != null && e.pct <= tolerance);

  return (
    <div className={clsx('card p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-emerald-400" />
        <h3 className="text-sm font-semibold">Error Analysis</h3>
        <div className={clsx(
          'ml-auto flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded',
          allPass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        )}>
          {allPass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {allPass ? 'Within tolerance' : 'Exceeds tolerance'}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {entries.map(({ key, label, value, pct, color }) => {
          const passes = pct != null && pct <= tolerance;
          return (
            <div
              key={key}
              className="bg-[var(--color-bg-primary)] rounded-md p-2.5 text-center border border-[var(--color-border-subtle)]"
            >
              <p className="text-2xs text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className="text-lg font-bold mono" style={{ color }}>
                {formatNum(value, 3)}
              </p>
              {pct != null && (
                <p className={clsx(
                  'text-2xs mono mt-0.5',
                  passes ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {formatPercent(pct)}
                  {passes ? ' ✓' : ' ✗'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bar chart visualization */}
      <div className="mb-3">
        <p className="label mb-2">Error Distribution (%)</p>
        <svg viewBox={`0 0 300 ${entries.length * 36 + 10}`} className="w-full" style={{ maxHeight: 140 }}>
          {entries.map(({ key, label, pct, color }, i) => {
            const y = i * 36 + 5;
            const barWidth = maxPct > 0 ? ((pct || 0) / maxPct) * 220 : 0;
            const toleranceX = maxPct > 0 ? (tolerance / maxPct) * 220 + 60 : 0;

            return (
              <g key={key}>
                {/* Label */}
                <text x="0" y={y + 14} fontSize="10" fill="var(--color-text-muted)"
                  fontFamily="JetBrains Mono, monospace">
                  {key.toUpperCase()}
                </text>

                {/* Bar background */}
                <rect x="60" y={y + 2} width="220" height="18" rx="3"
                  fill="var(--color-bg-input)" />

                {/* Bar fill */}
                <rect x="60" y={y + 2} width={Math.max(2, barWidth)} height="18" rx="3"
                  fill={color} opacity="0.7" />

                {/* Value label */}
                <text x={65 + barWidth} y={y + 14} fontSize="9" fill="var(--color-text-primary)"
                  fontFamily="JetBrains Mono, monospace">
                  {formatPercent(pct || 0)}
                </text>
              </g>
            );
          })}

          {/* Tolerance line */}
          {maxPct > 0 && (
            <>
              <line
                x1={60 + (tolerance / maxPct) * 220}
                y1="0"
                x2={60 + (tolerance / maxPct) * 220}
                y2={entries.length * 36 + 10}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.6"
              />
              <text
                x={62 + (tolerance / maxPct) * 220}
                y={entries.length * 36 + 8}
                fontSize="8"
                fill="#ef4444"
                opacity="0.8"
              >
                {tolerance}% tol
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Tolerance info */}
      <p className="text-2xs text-[var(--color-text-muted)]">
        Tolerance threshold: <span className="mono">{tolerance}%</span> of curve extent.
        {allPass
          ? ' All metrics are within the acceptable range.'
          : ' Consider adjusting parameters or trying a more complex mechanism type.'
        }
      </p>
    </div>
  );
}
