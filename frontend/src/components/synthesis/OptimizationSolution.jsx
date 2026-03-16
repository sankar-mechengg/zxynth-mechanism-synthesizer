import { Target, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { formatNum, formatAngle, formatGrashofType } from '../../utils/formatUtils';

/**
 * Optimization solution display card.
 * Shows the best result from DE/GA/PSO/SA.
 *
 * @param {object} props
 * @param {object|null} props.result - Optimization result from backend
 * @param {string} [props.className]
 */
export default function OptimizationSolution({ result, className = '' }) {
  if (!result) {
    return (
      <div className={clsx('card p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-emerald-400" />
          <h4 className="text-sm font-semibold">Optimization Solution</h4>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] italic">
          Run dimensional synthesis to generate an optimization result.
        </p>
      </div>
    );
  }

  const { mechanism, errorMetrics, grashofType, transmissionAngle, algorithm, generations, elapsed } = result;

  const grashofOk = grashofType && grashofType !== 'non-grashof';
  const transOk = transmissionAngle && transmissionAngle.min >= 30;

  return (
    <div className={clsx('card p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-emerald-400" />
        <h4 className="text-sm font-semibold">Optimization Solution</h4>
        {algorithm && (
          <span className="ml-auto text-2xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            {algorithm}
          </span>
        )}
      </div>

      {/* Link lengths table */}
      {mechanism && (
        <div className="mb-3">
          <p className="label mb-1.5">Mechanism Parameters</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {[
              ['a₁ (ground)', mechanism.a1],
              ['a₂ (crank)', mechanism.a2],
              ['a₃ (coupler)', mechanism.a3],
              ['a₄ (rocker)', mechanism.a4],
              ['p (coupler pt)', mechanism.p],
              ['α (cp angle)', mechanism.alpha],
            ].filter(([, v]) => v != null).map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{label}:</span>
                <span className="mono font-medium">
                  {label.includes('angle') || label.includes('α') ? formatAngle(val) : formatNum(val, 2)}
                </span>
              </div>
            ))}
          </div>

          {/* Ground pivots */}
          {mechanism.pivotA && (
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              <span>Pivot A: </span>
              <span className="mono">({formatNum(mechanism.pivotA[0])}, {formatNum(mechanism.pivotA[1])})</span>
              {mechanism.pivotD && (
                <>
                  <span className="mx-2">|</span>
                  <span>Pivot D: </span>
                  <span className="mono">({formatNum(mechanism.pivotD[0])}, {formatNum(mechanism.pivotD[1])})</span>
                </>
              )}
            </div>
          )}
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
                <p className="text-sm font-bold mono text-emerald-400">{formatNum(errorMetrics[key], 3)}</p>
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

      {/* Grashof + Transmission Angle checks */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Grashof */}
        <div className={clsx(
          'rounded-md p-2 border text-xs',
          grashofOk ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            {grashofOk
              ? <CheckCircle2 size={13} className="text-emerald-400" />
              : <XCircle size={13} className="text-amber-400" />
            }
            <span className={grashofOk ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              Grashof
            </span>
          </div>
          <p className="text-2xs text-[var(--color-text-muted)]">
            {grashofType ? formatGrashofType(grashofType) : 'Unknown'}
          </p>
        </div>

        {/* Transmission angle */}
        <div className={clsx(
          'rounded-md p-2 border text-xs',
          transOk ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            {transOk
              ? <CheckCircle2 size={13} className="text-emerald-400" />
              : <XCircle size={13} className="text-amber-400" />
            }
            <span className={transOk ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              Trans. Angle
            </span>
          </div>
          <p className="text-2xs text-[var(--color-text-muted)]">
            {transmissionAngle
              ? `Min: ${formatAngle(transmissionAngle.min)} / Max: ${formatAngle(transmissionAngle.max)}`
              : 'Unknown'
            }
          </p>
        </div>
      </div>

      {/* Run info */}
      {(generations || elapsed) && (
        <p className="text-2xs text-[var(--color-text-muted)]">
          {generations && `${generations} generations`}
          {generations && elapsed && ' · '}
          {elapsed && `${elapsed.toFixed(1)}s elapsed`}
        </p>
      )}
    </div>
  );
}
