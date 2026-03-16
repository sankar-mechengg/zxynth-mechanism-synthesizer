import { Check } from 'lucide-react';
import clsx from 'clsx';

/**
 * Horizontal step indicator for the synthesis workflow.
 *
 * Steps: 0=Input → 1=Type Synthesis → 2=Number Synthesis → 3=Dimensional → 4=Results
 *
 * @param {object} props
 * @param {number} props.currentStep - Current active step (0-indexed)
 * @param {Array<{label: string, shortLabel?: string}>} [props.steps] - Custom step labels
 * @param {function} [props.onStepClick] - Called with step index when a completed step is clicked
 * @param {string} [props.className] - Additional classes
 */

const DEFAULT_STEPS = [
  { label: 'Define Input', shortLabel: 'Input' },
  { label: 'Type Synthesis', shortLabel: 'Type' },
  { label: 'Number Synthesis', shortLabel: 'Number' },
  { label: 'Dimensional Synthesis', shortLabel: 'Dimension' },
  { label: 'Results', shortLabel: 'Results' },
];

export default function StepIndicator({
  currentStep = 0,
  steps = DEFAULT_STEPS,
  onStepClick,
  className = '',
}) {
  return (
    <div className={clsx('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;
        const isClickable = isComplete && onStepClick;

        return (
          <div
            key={index}
            className={clsx('flex items-center', !isLast && 'flex-1')}
          >
            {/* Step circle + label */}
            <div
              className={clsx(
                'flex flex-col items-center gap-1.5',
                isClickable && 'cursor-pointer group'
              )}
              onClick={() => isClickable && onStepClick(index)}
            >
              {/* Circle */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2',
                  isComplete
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 group-hover:bg-emerald-500/30'
                    : isActive
                    ? 'bg-blueprint-500/20 border-blueprint-400 text-blueprint-400 shadow-[0_0_12px_rgba(49,112,227,0.3)]'
                    : 'bg-[var(--color-bg-input)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                )}
              >
                {isComplete ? <Check size={14} /> : index + 1}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'text-2xs font-medium whitespace-nowrap transition-colors',
                  isComplete
                    ? 'text-emerald-400'
                    : isActive
                    ? 'text-blueprint-400'
                    : 'text-[var(--color-text-muted)]'
                )}
              >
                {step.shortLabel || step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-2 mt-[-18px]">
                <div
                  className={clsx(
                    'h-0.5 rounded-full transition-all duration-500',
                    isComplete
                      ? 'bg-emerald-500/50'
                      : 'bg-[var(--color-border)]'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
