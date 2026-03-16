import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import useSynthesisStore from '../stores/useSynthesisStore';
import PageContainer from '../components/layout/PageContainer';
import ResultsPage from '../components/results/ResultsPage';
import SynthesisComparison from '../components/synthesis/SynthesisComparison';
import ExportMenu from '../components/common/ExportMenu';
import { handleExport } from '../utils/exportUtils';

/**
 * Full results page — shows mechanism visualization, parameters, error metrics,
 * cognates, inversions, and export options.
 *
 * The left panel will contain the MechanismViewer (Batch 11).
 * The right panel contains results details.
 */
export default function Results() {
  const { setActiveProblemType, activeProblemType } = useAppStore();
  const synthesis = useSynthesisStore();
  const navigate = useNavigate();

  const hasResults = synthesis.status === 'complete';

  // Redirect if no results
  useEffect(() => {
    if (!hasResults) {
      // Give a moment for store to hydrate, then redirect
      const timer = setTimeout(() => {
        if (!useSynthesisStore.getState().mechanism) {
          navigate(activeProblemType ? `/${activeProblemType}` : '/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasResults, navigate, activeProblemType]);

  const handleExportAction = async (formatId) => {
    try {
      const data = {
        mechanism: synthesis.mechanism,
        parameters: synthesis.mechanism,
        errorMetrics: synthesis.errorMetrics,
        couplerCurve: synthesis.couplerCurve,
        grashofType: synthesis.grashofType,
        transmissionAngle: synthesis.transmissionAngle,
        cognates: synthesis.cognates,
      };
      await handleExport(formatId, data);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const backRoute = activeProblemType ? `/${activeProblemType}` : '/';

  return (
    <PageContainer fullWidth noPadding grid={false}>
      <div className="flex h-[calc(100vh-3.5rem-5rem)]">
        {/* Left: Mechanism Viewer (placeholder until Batch 11) */}
        <div className="flex-1 min-w-0 p-3 border-r border-[var(--color-border-subtle)]">
          <div className="h-full flex flex-col">
            {/* Header with back button and export */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(backRoute)}
                  className="btn-ghost gap-1 text-xs"
                >
                  <ArrowLeft size={14} />
                  Back to Synthesis
                </button>
              </div>
              <ExportMenu
                onExport={handleExportAction}
                disabled={!hasResults}
              />
            </div>

            {/* Mechanism Viewer area */}
            <div className="flex-1 min-h-0 bg-blueprint rounded-lg border border-[var(--color-border-subtle)] flex items-center justify-center">
              {hasResults && synthesis.mechanism ? (
                <div className="text-center">
                  <BarChart3 size={40} className="text-blueprint-400 mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                    Mechanism Viewer
                  </p>
                  <p className="text-2xs text-[var(--color-text-muted)]">
                    Interactive visualization will render here (Batch 11)
                  </p>
                  {synthesis.mechanism.a1 != null && (
                    <div className="mt-3 inline-flex gap-3 text-2xs mono text-[var(--color-text-muted)]">
                      <span>a₁={synthesis.mechanism.a1?.toFixed(1)}</span>
                      <span>a₂={synthesis.mechanism.a2?.toFixed(1)}</span>
                      <span>a₃={synthesis.mechanism.a3?.toFixed(1)}</span>
                      <span>a₄={synthesis.mechanism.a4?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[var(--color-text-muted)] text-sm mb-1">
                    No results available
                  </p>
                  <p className="text-2xs text-[var(--color-text-muted)]">
                    Run a synthesis first
                  </p>
                  <button
                    onClick={() => navigate(backRoute)}
                    className="btn-primary mt-3 text-xs py-1.5 px-4"
                  >
                    Go to Synthesis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results panels */}
        <div className="w-[440px] flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Page title */}
            <div>
              <h2 className="text-lg font-bold">Synthesis Results</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {activeProblemType === 'path' && 'Path Generation'}
                {activeProblemType === 'function' && 'Function Generation'}
                {activeProblemType === 'motion' && 'Motion Generation'}
                {!activeProblemType && 'Mechanism Synthesis'}
              </p>
            </div>

            {hasResults ? (
              <ResultsPage />
            ) : (
              <div className="card p-6 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Run a synthesis to see results here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
