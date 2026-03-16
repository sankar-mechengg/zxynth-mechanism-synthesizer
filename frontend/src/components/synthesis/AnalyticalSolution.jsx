import { Ruler, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { formatNum, formatAngle } from '../../utils/formatUtils';

/**
 * Analytical solution display card.
 * Shows the precision-point synthesis result (Freudenstein / Burmester).
 *
 * @param {object} props
 * @param {object|null} props.result - Analytical result object from backend
 * @param {string} [props.className]
 */
export default function AnalyticalSolution({ result, className = '' }) {
  if (!result) {
    return (
      <div className={clsx('card p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Ruler size={16} className="text-blue-400" />
          <h4 className="text-sm font-semibold">Analytical Solution</h4>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] italic">
          No analytical solution available. This may be because the problem
          requires more than 5 precision points, or the analytical method
          did not converge for this configuration.
        </p>
      </div>
    );
  }

  const { mechanism, errorMetrics, method, precisionPoints, warnings } = result;

  return (
    <div className={clsx('card p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Ruler size={16} className="text-blue-400" />
        <h4 className="text-sm font-semibold">Analytical Solution</h4>
        {method && (
          <span className="ml-auto text-2xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-input)] px-2 py-0.5 rounded">
            {method}
          </span>
        )}
      </div>

      {/* Link lengths */}
      {mechanism && (
        <div className="mb-3">
          <p className="label mb-1.5">Link Lengths</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {mechanism.a1 != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">a₁ (ground):</span>
                <span className="mono font-medium">{formatNum(mechanism.a1, 2)}</span>
              </div>
            )}
            {mechanism.a2 != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">a₂ (crank):</span>
                <span className="mono font-medium">{formatNum(mechanism.a2, 2)}</span>
              </div>
            )}
            {mechanism.a3 != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">a₃ (coupler):</span>
                <span className="mono font-medium">{formatNum(mechanism.a3, 2)}</span>
              </div>
            )}
            {mechanism.a4 != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">a₄ (rocker):</span>
                <span className="mono font-medium">{formatNum(mechanism.a4, 2)}</span>
              </div>
            )}
            {mechanism.p != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">p (coupler pt):</span>
                <span className="mono font-medium">{formatNum(mechanism.p, 2)}</span>
              </div>
            )}
            {mechanism.alpha != null && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">α (cp angle):</span>
                <span className="mono font-medium">{formatAngle(mechanism.alpha)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error metrics */}
      {errorMetrics && (
        <div className="mb-3">
          <p className="label mb-1.5">Error Metrics</p>
          <div className="grid grid-cols-3 gap-2">
            {['mean', 'max', 'rms'].map((key) => (
              <div key={key} className="bg-[var(--color-bg-primary)] rounded-md p-2 text-center border border-[var(--color-border-subtle)]">
                <p className="text-2xs text-[var(--color-text-muted)] capitalize">{key}</p>
                <p className="text-sm font-bold mono">{formatNum(errorMetrics[key], 3)}</p>
                {errorMetrics[`${key}Percent`] != null && (
                  <p className="text-2xs text-[var(--color-text-muted)]">
                    ({formatNum(errorMetrics[`${key}Percent`], 2)}%)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Precision points used */}
      {precisionPoints && (
        <p className="text-2xs text-[var(--color-text-muted)]">
          Precision points used: {precisionPoints}
        </p>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-2xs text-amber-400">
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
