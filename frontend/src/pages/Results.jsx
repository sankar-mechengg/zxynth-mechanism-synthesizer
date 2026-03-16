import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import useSynthesisStore from '../stores/useSynthesisStore';
import usePathStore from '../stores/usePathStore';
import useMotionStore from '../stores/useMotionStore';
import PageContainer from '../components/layout/PageContainer';
import ResultsPage from '../components/results/ResultsPage';
import MechanismViewer from '../components/visualization/MechanismViewer';
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

  const pathStore = usePathStore();
  const motionStore = useMotionStore();
  const hasResults = synthesis.status === 'complete';

  // Desired path for visualization (path = points, motion = pose centers, function = empty)
  const desiredPath = useMemo(() => {
    if (activeProblemType === 'path') {
      return pathStore.points.map((p) => ({ x: p.x, y: p.y }));
    }
    if (activeProblemType === 'motion') {
      return motionStore.poses.map((p) => ({ x: p.x, y: p.y }));
    }
    return [];
  }, [activeProblemType, pathStore.points, motionStore.poses]);

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

  const handleReset = () => {
    useSynthesisStore.getState().reset();
    useAppStore.getState().resetWorkflow();
    navigate(backRoute);
  };

  return (
    <PageContainer fullWidth noPadding grid={false}>
      <div className="flex h-[calc(100vh-3.5rem-5rem)]">
        {/* Left: Mechanism Viewer */}
        <div className="flex-1 min-w-0 p-3 border-r border-[var(--color-border-subtle)]">
          <div className="h-full flex flex-col">
            {/* Header with back button and export */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    useAppStore.getState().resetWorkflow();
                    navigate(backRoute);
                  }}
                  className="btn-ghost gap-1 text-xs"
                >
                  <ArrowLeft size={14} />
                  Back to Synthesis
                </button>
                <button
                  onClick={handleReset}
                  className="btn-ghost gap-1 text-xs text-amber-400 hover:text-amber-300"
                  title="Clear results and start over with new selections"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <ExportMenu
                onExport={handleExportAction}
                disabled={!hasResults}
              />
            </div>

            {/* Mechanism Viewer area */}
            <div className="flex-1 min-h-0 bg-blueprint rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
              {hasResults && synthesis.mechanism ? (
                <MechanismViewer desiredPath={desiredPath} className="h-full" />
              ) : (
                <div className="h-full flex items-center justify-center">
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
