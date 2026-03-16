import clsx from 'clsx';
import useSynthesisStore from '../../stores/useSynthesisStore';
import AnalyticalSolution from './AnalyticalSolution';
import OptimizationSolution from './OptimizationSolution';

/**
 * Side-by-side comparison of analytical and optimization results.
 * Includes a toggle to select which result is "active" for visualization.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function SynthesisComparison({ className = '' }) {
  const {
    analyticalResult,
    optimizationResult,
    activeResultView,
    setActiveResultView,
  } = useSynthesisStore();

  const hasAnalytical = !!analyticalResult;
  const hasOptimization = !!optimizationResult;

  if (!hasAnalytical && !hasOptimization) {
    return null;
  }

  return (
    <div className={clsx('flex flex-col gap-3 animate-in', className)}>
      {/* Toggle: which result to use for visualization */}
      {hasAnalytical && hasOptimization && (
        <div>
          <p className="label mb-1.5">Active Result (used for visualization & export)</p>
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-input)]">
            <button
              onClick={() => setActiveResultView('analytical')}
              className={clsx(
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
                activeResultView === 'analytical'
                  ? 'bg-[var(--color-bg-elevated)] text-blue-400 shadow-sm'
                  : 'text-[var(--color-text-muted)]'
              )}
            >
              Analytical
            </button>
            <button
              onClick={() => setActiveResultView('optimization')}
              className={clsx(
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
                activeResultView === 'optimization'
                  ? 'bg-[var(--color-bg-elevated)] text-emerald-400 shadow-sm'
                  : 'text-[var(--color-text-muted)]'
              )}
            >
              Optimization
            </button>
          </div>
        </div>
      )}

      {/* Results cards */}
      <div className={clsx(
        hasAnalytical && hasOptimization ? 'grid grid-cols-2 gap-3' : ''
      )}>
        {hasAnalytical && (
          <div className={clsx(
            activeResultView === 'analytical' && hasOptimization && 'ring-1 ring-blue-400/30 rounded-lg'
          )}>
            <AnalyticalSolution result={analyticalResult} />
          </div>
        )}
        {hasOptimization && (
          <div className={clsx(
            activeResultView === 'optimization' && hasAnalytical && 'ring-1 ring-emerald-400/30 rounded-lg'
          )}>
            <OptimizationSolution result={optimizationResult} />
          </div>
        )}
      </div>

      {/* Comparison summary */}
      {hasAnalytical && hasOptimization && analyticalResult.errorMetrics && optimizationResult.errorMetrics && (
        <div className="card p-3">
          <p className="label mb-2">Comparison</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div />
            <div className="text-center text-blue-400 font-medium">Analytical</div>
            <div className="text-center text-emerald-400 font-medium">Optimization</div>
            <div className="text-center text-[var(--color-text-muted)]">Winner</div>

            {['mean', 'max', 'rms'].map((key) => {
              const aVal = analyticalResult.errorMetrics[key];
              const oVal = optimizationResult.errorMetrics[key];
              const winner = aVal != null && oVal != null
                ? (aVal <= oVal ? 'analytical' : 'optimization')
                : null;
              return (
                <>
                  <div key={`${key}-label`} className="text-[var(--color-text-muted)] capitalize">{key} error:</div>
                  <div key={`${key}-a`} className={clsx('text-center mono', winner === 'analytical' && 'font-bold text-blue-400')}>
                    {aVal != null ? aVal.toFixed(3) : '—'}
                  </div>
                  <div key={`${key}-o`} className={clsx('text-center mono', winner === 'optimization' && 'font-bold text-emerald-400')}>
                    {oVal != null ? oVal.toFixed(3) : '—'}
                  </div>
                  <div key={`${key}-w`} className="text-center">
                    {winner === 'analytical' && <span className="text-blue-400">◀</span>}
                    {winner === 'optimization' && <span className="text-emerald-400">▶</span>}
                  </div>
                </>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
