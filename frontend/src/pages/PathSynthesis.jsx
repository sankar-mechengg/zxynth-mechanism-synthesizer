import { useEffect } from 'react';
import useAppStore from '../stores/useAppStore';
import usePathStore from '../stores/usePathStore';
import useSynthesisStore from '../stores/useSynthesisStore';
import PageContainer from '../components/layout/PageContainer';
import DrawingCanvas from '../components/canvas/DrawingCanvas';
import PathInputPanel from '../components/input/PathInputPanel';
import SynthesisPage from '../components/synthesis/SynthesisPage';

/**
 * Path Generation synthesis page.
 * Layout: Canvas (left 55%) + Input/Synthesis panel (right 45%)
 */
export default function PathSynthesis() {
  const { setActiveProblemType, currentStep, resetWorkflow } = useAppStore();
  const store = usePathStore();
  const { reset: resetSynthesis } = useSynthesisStore();

  // Set active problem type on mount
  useEffect(() => {
    setActiveProblemType('path');
    return () => {
      // Don't reset on unmount — user might navigate to results
    };
  }, [setActiveProblemType]);

  const hasInput = store.points.length >= 2;

  return (
    <PageContainer fullWidth noPadding grid={false}>
      <div className="flex h-[calc(100vh-3.5rem-5rem)]">
        {/* Left: Drawing Canvas */}
        <div className="flex-1 min-w-0 p-3 border-r border-[var(--color-border-subtle)]">
          <div className="h-full flex flex-col">
            {/* Canvas header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Desired Path Canvas
              </h2>
              {store.points.length > 0 && (
                <span className="text-2xs mono text-[var(--color-text-muted)]">
                  {store.points.length} points
                  {store.inputSource && (
                    <span className="ml-1 text-blueprint-400">
                      ({store.inputSource.replace('upload_', '').replace('_', ' ')})
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 min-h-0">
              <DrawingCanvas
                points={store.points}
                onPointsChange={store.setPoints}
                controlPoints={store.controlPoints}
                onControlPointsChange={store.setControlPoints}
                height={undefined}
                className="h-full [&>svg]:h-full"
              />
            </div>
          </div>
        </div>

        {/* Right: Input + Synthesis Panel */}
        <div className="w-[440px] flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <SynthesisPage
              problemType="path"
              mechanismType={store.mechanismType}
              buildRequest={store.buildRequest}
              hasInput={hasInput}
              inputContent={<PathInputPanel />}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
