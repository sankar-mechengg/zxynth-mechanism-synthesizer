import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import useAppStore from '../../stores/useAppStore';
import useSynthesisStore from '../../stores/useSynthesisStore';
import StepIndicator from '../common/StepIndicator';
import TypeSynthesisStep from './TypeSynthesisStep';
import NumberSynthesisStep from './NumberSynthesisStep';
import DimensionalSynthesisStep from './DimensionalSynthesisStep';
import SynthesisComparison from './SynthesisComparison';

/**
 * Master synthesis workflow page.
 * Manages the stepper and routes to the correct step content.
 *
 * @param {object} props
 * @param {string} props.problemType - 'path' | 'function' | 'motion'
 * @param {string} props.mechanismType - Selected mechanism type id
 * @param {function} props.buildRequest - Builds the synthesis request payload
 * @param {boolean} props.hasInput - Whether valid input data exists
 * @param {React.ReactNode} [props.inputContent] - Input panel content (rendered at step 0)
 * @param {string} [props.className]
 */
export default function SynthesisPage({
  problemType,
  mechanismType,
  buildRequest,
  hasInput = false,
  inputContent,
  className = '',
}) {
  const { currentStep, setCurrentStep } = useAppStore();
  const { status } = useSynthesisStore();
  const navigate = useNavigate();

  const isComplete = status === 'complete';

  // Step validation — can we proceed to the next step?
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return hasInput; // Input defined
      case 1: return true;     // Type synthesis is informational
      case 2: return true;     // Number synthesis is informational
      case 3: return isComplete; // Dimensional synthesis must complete
      case 4: return true;     // Results — final step
      default: return false;
    }
  }, [currentStep, hasInput, isComplete]);

  const goNext = useCallback(() => {
    if (currentStep < 4 && canProceed) {
      setCurrentStep(currentStep + 1);
    }
    if (currentStep === 4) {
      navigate('/results');
    }
  }, [currentStep, canProceed, setCurrentStep, navigate]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  // Disable reason for dimensional synthesis
  const startDisabledReason = !hasInput
    ? 'Define input data first (Step 1)'
    : '';

  return (
    <div className={clsx('flex flex-col gap-6', className)}>
      {/* Stepper */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={(step) => {
          // Allow clicking back to completed steps
          if (step <= currentStep) setCurrentStep(step);
        }}
      />

      {/* Step content */}
      <div className="min-h-[300px]">
        {/* Step 0: Input */}
        {currentStep === 0 && (
          <div className="animate-in">
            {inputContent}
          </div>
        )}

        {/* Step 1: Type Synthesis */}
        {currentStep === 1 && (
          <TypeSynthesisStep
            problemType={problemType}
            mechanismType={mechanismType}
          />
        )}

        {/* Step 2: Number Synthesis */}
        {currentStep === 2 && (
          <NumberSynthesisStep
            mechanismType={mechanismType}
          />
        )}

        {/* Step 3: Dimensional Synthesis */}
        {currentStep === 3 && (
          <DimensionalSynthesisStep
            buildRequest={buildRequest}
            canStart={hasInput}
            startDisabledReason={startDisabledReason}
          />
        )}

        {/* Step 4: Results comparison */}
        {currentStep === 4 && (
          <div className="animate-in">
            <SynthesisComparison />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className={clsx(
            'btn-ghost gap-1.5',
            currentStep === 0 && 'opacity-30 cursor-not-allowed'
          )}
        >
          <ArrowLeft size={14} />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {/* View results button — available once synthesis is complete */}
          {isComplete && currentStep < 4 && (
            <button
              onClick={() => setCurrentStep(4)}
              className="btn-ghost gap-1.5 text-emerald-400"
            >
              <BarChart3 size={14} />
              View Results
            </button>
          )}

          <button
            onClick={goNext}
            disabled={!canProceed}
            className={clsx(
              currentStep === 4 ? 'btn-primary gap-1.5' : 'btn-secondary gap-1.5',
              !canProceed && 'opacity-40 cursor-not-allowed'
            )}
          >
            {currentStep === 4 ? (
              <>
                <BarChart3 size={14} />
                Full Results
              </>
            ) : (
              <>
                Next
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
