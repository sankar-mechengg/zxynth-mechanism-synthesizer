import { useEffect, useCallback } from 'react';
import useAppStore from '../stores/useAppStore';
import useMotionStore from '../stores/useMotionStore';
import useSynthesisStore from '../stores/useSynthesisStore';
import PageContainer from '../components/layout/PageContainer';
import MotionInputPanel from '../components/input/MotionInputPanel';
import SynthesisPage from '../components/synthesis/SynthesisPage';
import useCanvasInteraction from '../hooks/useCanvasInteraction';

/**
 * Motion Generation synthesis page.
 * Layout: Pose canvas (left 55%) + Input/Synthesis panel (right 45%)
 */
export default function MotionSynthesis() {
  const { setActiveProblemType } = useAppStore();
  const store = useMotionStore();

  useEffect(() => {
    setActiveProblemType('motion');
  }, [setActiveProblemType]);

  const hasInput = store.poses.length >= 2;

  return (
    <PageContainer fullWidth noPadding grid={false}>
      <div className="flex h-[calc(100vh-3.5rem-5rem)]">
        {/* Left: Pose Visualization Canvas */}
        <div className="flex-1 min-w-0 p-3 border-r border-[var(--color-border-subtle)]">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Precision Poses Canvas
              </h2>
              <span className="text-2xs mono text-[var(--color-text-muted)]">
                {store.poses.length} poses defined
              </span>
            </div>

            <div className="flex-1 min-h-0 bg-blueprint rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
              <PoseCanvas
                poses={store.poses}
                couplerShape={store.couplerShape}
                activePoseIndex={store.activePoseIndex}
                onPoseUpdate={store.updatePose}
                onPoseAdd={store.addPose}
                placingNewPose={store.placingNewPose}
                onPlacingDone={() => store.setPlacingNewPose(false)}
              />
            </div>
          </div>
        </div>

        {/* Right: Input + Synthesis Panel */}
        <div className="w-[440px] flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <SynthesisPage
              problemType="motion"
              mechanismType={store.mechanismType}
              buildRequest={store.buildRequest}
              hasInput={hasInput}
              inputContent={<MotionInputPanel />}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * Canvas showing precision poses as positioned/rotated coupler shapes.
 */
function PoseCanvas({
  poses,
  couplerShape,
  activePoseIndex,
  onPoseUpdate,
  onPoseAdd,
  placingNewPose,
  onPlacingDone,
}) {
  const {
    offset, scale, handleWheel, handlePanStart, handlePanMove, handlePanEnd,
    screenToWorld, fitToBounds, setScale,
  } = useCanvasInteraction();

  // Fit to poses on first render
  useEffect(() => {
    if (poses.length >= 2) {
      const xs = poses.map((p) => p.x);
      const ys = poses.map((p) => p.y);
      const pad = 60;
      fitToBounds(
        [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad],
        600, 500
      );
    }
  }, []); // Only on mount

  const handleCanvasClick = useCallback((e) => {
    if (!placingNewPose) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    onPoseAdd({ x: Math.round(world.x), y: Math.round(world.y), theta: 0 });
    onPlacingDone();
  }, [placingNewPose, screenToWorld, onPoseAdd, onPlacingDone]);

  const colors = ['#34d399', '#60a5fa', '#f472b6', '#f59e0b', '#a78bfa', '#fb923c', '#22d3ee'];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 600 500"
      className={placingNewPose ? 'cursor-crosshair' : ''}
      onWheel={handleWheel}
      onMouseDown={(e) => { if (e.button === 1) handlePanStart(e); }}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onClick={handleCanvasClick}
    >
      {/* Grid */}
      <defs>
        <pattern id="pose-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="20" y1="0" x2="20" y2="20" stroke="var(--grid-minor)" strokeWidth="0.5" />
          <line x1="0" y1="20" x2="20" y2="20" stroke="var(--grid-minor)" strokeWidth="0.5" />
        </pattern>
        <pattern id="pose-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <line x1="100" y1="0" x2="100" y2="100" stroke="var(--grid-major)" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="var(--grid-major)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="600" height="500" fill="url(#pose-grid-minor)" />
      <rect width="600" height="500" fill="url(#pose-grid-major)" />

      {/* Connecting arrows between consecutive poses */}
      {poses.length > 1 && poses.slice(0, -1).map((p, i) => {
        const next = poses[i + 1];
        const sx1 = p.x * scale + offset.x, sy1 = p.y * scale + offset.y;
        const sx2 = next.x * scale + offset.x, sy2 = next.y * scale + offset.y;
        return (
          <line key={`arrow-${i}`} x1={sx1} y1={sy1} x2={sx2} y2={sy2}
            stroke="var(--color-text-muted)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4"
            markerEnd="url(#pose-arrowhead)" />
        );
      })}

      <defs>
        <marker id="pose-arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-text-muted)" opacity="0.4" />
        </marker>
      </defs>

      {/* Poses as rotated coupler shapes */}
      {poses.map((pose, i) => {
        const sx = pose.x * scale + offset.x;
        const sy = pose.y * scale + offset.y;
        const color = colors[i % colors.length];
        const isActive = i === activePoseIndex;
        const opacity = 0.3 + (i / Math.max(1, poses.length - 1)) * 0.7;

        return (
          <g key={i} transform={`translate(${sx}, ${sy}) rotate(${-pose.theta})`} opacity={opacity}>
            {/* Coupler body */}
            <polygon
              points={couplerShape.map((cp) => `${cp.x * scale * 0.8},${cp.y * scale * 0.8}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeLinejoin="round"
            />
            {/* Reference point */}
            <circle cx="0" cy="0" r={isActive ? 4 : 3} fill={color} />
            {/* Label */}
            <text x="0" y={-12 * Math.max(0.5, scale)} textAnchor="middle"
              fontSize="10" fontWeight="600" fill={color}
              fontFamily="JetBrains Mono, monospace">
              P{i + 1}
            </text>
            {/* Orientation indicator line */}
            <line x1="0" y1="0" x2={20 * scale * 0.8} y2="0"
              stroke={color} strokeWidth="1.5" opacity="0.5" />
          </g>
        );
      })}

      {/* Placing hint */}
      {placingNewPose && (
        <text x="300" y="480" textAnchor="middle" fontSize="12" fill="var(--color-text-muted)">
          Click to place pose P{poses.length + 1}
        </text>
      )}
    </svg>
  );
}
