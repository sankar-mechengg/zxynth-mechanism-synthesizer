import useSynthesisStore from '../../stores/useSynthesisStore';
import useAppStore from '../../stores/useAppStore';
import MechanismParams from './MechanismParams';
import ErrorMetrics from './ErrorMetrics';
import CognatesPanel from './CognatesPanel';
import InversionPanel from './InversionPanel';
import PerformanceSummary from './PerformanceSummary';
import SynthesisComparison from '../synthesis/SynthesisComparison';

/**
 * Composes all result display panels for the right sidebar.
 * Used inside the Results page route.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function ResultsPage({ className = '' }) {
  const { activeProblemType } = useAppStore();
  const {
    status,
    mechanism,
    errorMetrics,
    grashofType,
    transmissionAngle,
    defects,
    cognates,
    activeInversion,
  } = useSynthesisStore();

  const hasResults = status === 'complete' && mechanism;

  if (!hasResults) {
    return (
      <div className={className}>
        <div className="card p-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No synthesis results available.
          </p>
          <p className="text-2xs text-[var(--color-text-muted)] mt-1">
            Run a synthesis from the Path, Function, or Motion page first.
          </p>
        </div>
      </div>
    );
  }

  // Determine mechanism type from the active problem store
  const mechanismType = mechanism?.type || 'four_bar';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold">Synthesis Results</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {activeProblemType === 'path' && 'Path Generation'}
          {activeProblemType === 'function' && 'Function Generation'}
          {activeProblemType === 'motion' && 'Motion Generation'}
        </p>
      </div>

      {/* Analytical vs Optimization comparison */}
      <SynthesisComparison />

      {/* Mechanism parameters */}
      <MechanismParams
        mechanism={mechanism}
        mechanismType={mechanismType}
      />

      {/* Error analysis */}
      <ErrorMetrics metrics={errorMetrics} />

      {/* Performance checks */}
      <PerformanceSummary
        grashofType={grashofType}
        transmissionAngle={transmissionAngle}
        defects={defects}
        grashofMargin={mechanism?.grashofMargin}
      />

      {/* Roberts-Chebyshev cognates */}
      <CognatesPanel
        cognates={cognates}
        activeCognate={0}
        onSelectCognate={() => {}}
      />

      {/* Kinematic inversion */}
      <InversionPanel mechanismType={mechanismType} />
    </div>
  );
}
