import { Activity, Zap, Timer, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

/**
 * Optimization progress panel showing real-time metrics.
 *
 * @param {object} props
 * @param {string} props.status - 'idle' | 'queued' | 'running' | 'complete' | 'error'
 * @param {number} [props.generation] - Current generation/iteration number
 * @param {number} [props.maxGenerations] - Total generations to run
 * @param {number} [props.bestFitness] - Current best fitness value
 * @param {string} [props.algorithm] - Name of running algorithm
 * @param {number} [props.elapsed] - Elapsed seconds
 * @param {string} [props.errorMessage] - Error message if status='error'
 * @param {string} [props.className] - Additional classes
 */
export default function ProgressPanel({
  status = 'idle',
  generation = 0,
  maxGenerations = 400,
  bestFitness = null,
  algorithm = '',
  elapsed = 0,
  errorMessage = '',
  className = '',
}) {
  const progress = maxGenerations > 0 ? (generation / maxGenerations) * 100 : 0;
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  const statusLabel = {
    idle: 'Ready',
    queued: 'Queued...',
    running: 'Optimizing',
    complete: 'Complete',
    error: 'Error',
  }[status] || status;

  const statusColor = {
    idle: 'text-[var(--color-text-muted)]',
    queued: 'text-amber-400',
    running: 'text-blueprint-400',
    complete: 'text-emerald-400',
    error: 'text-red-400',
  }[status];

  return (
    <div className={clsx('card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity
            size={16}
            className={clsx(
              statusColor,
              isRunning && 'animate-pulse'
            )}
          />
          <span className={clsx('text-sm font-semibold', statusColor)}>
            {statusLabel}
          </span>
        </div>
        {algorithm && (
          <span className="text-2xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-input)] px-2 py-0.5 rounded">
            {algorithm}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-[var(--color-bg-input)] overflow-hidden mb-3">
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            isComplete
              ? 'bg-emerald-500'
              : isError
              ? 'bg-red-500'
              : 'bg-blueprint-500'
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
        {isRunning && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Generation */}
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-2xs text-[var(--color-text-muted)]">Generation</p>
            <p className="text-sm font-semibold mono">
              {generation}
              <span className="text-[var(--color-text-muted)] font-normal">/{maxGenerations}</span>
            </p>
          </div>
        </div>

        {/* Best fitness */}
        <div className="flex items-center gap-1.5">
          <TrendingDown size={12} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-2xs text-[var(--color-text-muted)]">Best Fitness</p>
            <p className="text-sm font-semibold mono">
              {bestFitness !== null ? bestFitness.toFixed(4) : '—'}
            </p>
          </div>
        </div>

        {/* Elapsed time */}
        <div className="flex items-center gap-1.5">
          <Timer size={12} className="text-blueprint-400 flex-shrink-0" />
          <div>
            <p className="text-2xs text-[var(--color-text-muted)]">Elapsed</p>
            <p className="text-sm font-semibold mono">
              {elapsed > 60
                ? `${Math.floor(elapsed / 60)}m ${Math.round(elapsed % 60)}s`
                : `${elapsed.toFixed(1)}s`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {isError && errorMessage && (
        <div className="mt-3 p-2 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
