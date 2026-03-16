import { Cpu, Play, Square, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import useSynthesisStore from '../../stores/useSynthesisStore';
import ProgressPanel from '../common/ProgressPanel';

/**
 * Dimensional Synthesis step — submits optimization job and displays progress.
 *
 * @param {object} props
 * @param {function} props.buildRequest - Function that returns the synthesis request payload
 * @param {boolean} props.canStart - Whether all prerequisites are met to start
 * @param {string} [props.startDisabledReason] - Reason why start is disabled
 * @param {string} [props.className]
 */
export default function DimensionalSynthesisStep({
  buildRequest,
  canStart = false,
  startDisabledReason = '',
  className = '',
}) {
  const {
    status,
    error,
    generation,
    maxGenerations,
    bestFitness,
    runningAlgorithm,
    elapsed,
    submitJob,
    cancelJob,
  } = useSynthesisStore();

  const isIdle = status === 'idle' || status === 'error';
  const isRunning = status === 'running' || status === 'queued' || status === 'submitting';
  const isComplete = status === 'complete';

  const handleStart = async () => {
    if (!canStart) return;
    const request = buildRequest();
    await submitJob(request);
  };

  return (
    <div className={clsx('flex flex-col gap-4 animate-in', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={clsx(
          'p-2.5 rounded-lg bg-[var(--color-bg-input)]',
          isRunning ? 'text-blueprint-400 animate-pulse' : isComplete ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'
        )}>
          <Cpu size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Dimensional Synthesis</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Computing optimal link lengths and pivot locations
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="card p-4">
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
          This step runs both <strong>analytical</strong> (precision-point) and{' '}
          <strong>optimization-based</strong> (global search) dimensional synthesis.
          The analytical method finds exact solutions for a few precision points,
          while the optimizer searches for the best overall fit across all path points.
        </p>

        <div className="text-2xs text-[var(--color-text-muted)] space-y-1 mb-4">
          <p>The optimizer will:</p>
          <p className="pl-3">1. Initialize multiple random seed populations</p>
          <p className="pl-3">2. Evolve solutions to minimize path error</p>
          <p className="pl-3">3. Apply constraints (Grashof, transmission angle, assembly)</p>
          <p className="pl-3">4. Refine the best solution with Nelder-Mead (for DE)</p>
        </div>

        {/* Start / Cancel button */}
        <div className="flex items-center gap-3">
          {isIdle && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={clsx(
                'btn-primary gap-2',
                !canStart && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Play size={16} />
              Run Synthesis
            </button>
          )}

          {isRunning && (
            <button
              onClick={cancelJob}
              className="btn-secondary gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Square size={14} />
              Cancel
            </button>
          )}

          {isComplete && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="btn-secondary gap-2"
            >
              <Play size={14} />
              Re-run Synthesis
            </button>
          )}

          {!canStart && startDisabledReason && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle size={14} />
              {startDisabledReason}
            </div>
          )}
        </div>
      </div>

      {/* Progress panel — shown when job is running or complete */}
      {(isRunning || isComplete || status === 'error') && (
        <ProgressPanel
          status={status}
          generation={generation}
          maxGenerations={maxGenerations}
          bestFitness={bestFitness}
          algorithm={runningAlgorithm}
          elapsed={elapsed}
          errorMessage={error}
        />
      )}

      {/* Error display */}
      {status === 'error' && error && (
        <div className="card p-3 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Synthesis Failed</p>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="mt-2 text-xs text-blueprint-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete summary */}
      {isComplete && (
        <div className="card p-3 bg-emerald-500/5 border-emerald-500/20">
          <p className="text-sm font-medium text-emerald-400 mb-1">
            Synthesis Complete
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Optimal mechanism found in {elapsed.toFixed(1)}s.
            Best fitness: {bestFitness?.toFixed(4) ?? '—'}.
            View results in the next step.
          </p>
        </div>
      )}
    </div>
  );
}
