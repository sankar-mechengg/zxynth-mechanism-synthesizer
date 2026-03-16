import { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import useCanvasInteraction from '../../hooks/useCanvasInteraction';
import GridOverlay from './GridOverlay';
import PathPreview from './PathPreview';
import FreehandTool from './FreehandTool';
import PointPlaceTool from './PointPlaceTool';
import PointEditor from './PointEditor';
import CanvasToolbar from './CanvasToolbar';

/**
 * Main drawing canvas for path input.
 * Composes all canvas sub-components: grid, drawing tools, path preview.
 *
 * @param {object} props
 * @param {Array<{x: number, y: number}>} props.points - Current path points (world coords)
 * @param {function} props.onPointsChange - Called with updated points array
 * @param {Array<{x: number, y: number}>} [props.controlPoints] - Bézier control points (for point tool)
 * @param {function} [props.onControlPointsChange] - Called with updated control points
 * @param {boolean} [props.showGrid=true] - Show engineering grid
 * @param {number} [props.height=500] - Canvas height in pixels
 * @param {string} [props.className] - Additional classes
 */
export default function DrawingCanvas({
  points = [],
  onPointsChange,
  controlPoints = [],
  onControlPointsChange,
  showGrid = true,
  height = 500,
  className = '',
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [activeTool, setActiveTool] = useState('freehand');
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [history, setHistory] = useState([]);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const {
    offset,
    scale,
    screenToWorld,
    worldToScreen,
    snapToGrid,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
    fitToBounds,
    setScale,
  } = useCanvasInteraction({
    snapEnabled,
    gridSize: 20,
  });

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Space key for pan mode
  useEffect(() => {
    const down = (e) => { if (e.code === 'Space' && !e.repeat) setSpaceHeld(true); };
    const up = (e) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Push current state to history before changes
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), { points: [...points], controlPoints: [...controlPoints] }]);
  }, [points, controlPoints]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onPointsChange?.(prev.points);
    onControlPointsChange?.(prev.controlPoints);
  }, [history, onPointsChange, onControlPointsChange]);

  // Clear
  const handleClear = useCallback(() => {
    pushHistory();
    onPointsChange?.([]);
    onControlPointsChange?.([]);
  }, [pushHistory, onPointsChange, onControlPointsChange]);

  // Freehand stroke complete → replace all points
  const handleStrokeComplete = useCallback(
    (strokePoints) => {
      pushHistory();
      onPointsChange?.(strokePoints);
      onControlPointsChange?.([]);
    },
    [pushHistory, onPointsChange, onControlPointsChange]
  );

  // Add control point
  const handleAddControlPoint = useCallback(
    (pt) => {
      pushHistory();
      const newCp = [...controlPoints, pt];
      onControlPointsChange?.(newCp);
      // Also generate sampled path from Bézier curve through control points
      if (newCp.length >= 2) {
        const sampled = sampleBezierPath(newCp, 100);
        onPointsChange?.(sampled);
      }
    },
    [controlPoints, pushHistory, onControlPointsChange, onPointsChange]
  );

  // Update control point position
  const handleUpdateControlPoint = useCallback(
    (index, newPos) => {
      const newCp = [...controlPoints];
      newCp[index] = newPos;
      onControlPointsChange?.(newCp);
      // Regenerate sampled path
      if (newCp.length >= 2) {
        const sampled = sampleBezierPath(newCp, 100);
        onPointsChange?.(sampled);
      }
    },
    [controlPoints, onControlPointsChange, onPointsChange]
  );

  // Delete control point
  const handleDeleteControlPoint = useCallback(
    (index) => {
      pushHistory();
      const newCp = controlPoints.filter((_, i) => i !== index);
      onControlPointsChange?.(newCp);
      if (newCp.length >= 2) {
        const sampled = sampleBezierPath(newCp, 100);
        onPointsChange?.(sampled);
      } else {
        onPointsChange?.([]);
      }
    },
    [controlPoints, pushHistory, onControlPointsChange, onPointsChange]
  );

  // Zoom buttons
  const zoomIn = () => setScale((s) => Math.min(10, s * 1.3));
  const zoomOut = () => setScale((s) => Math.max(0.1, s / 1.3));
  const fitView = () => {
    if (points.length < 2) { resetView(); return; }
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    fitToBounds(
      [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      containerWidth,
      height
    );
  };

  // Mouse down handler — route to pan or tool
  const handleMouseDown = (e) => {
    if (spaceHeld || e.button === 1) {
      const synth = { ...e, _forcePan: true };
      handlePanStart(synth);
    }
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onClear={handleClear}
        onUndo={handleUndo}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={fitView}
        canUndo={history.length > 0}
        canClear={points.length > 0 || controlPoints.length > 0}
        pointCount={points.length}
        className="absolute top-3 left-3 z-10"
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] text-2xs mono text-[var(--color-text-muted)]">
        {(scale * 100).toFixed(0)}%
      </div>

      {/* SVG Canvas */}
      <svg
        width={containerWidth}
        height={height}
        className={clsx(
          'rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]',
          spaceHeld ? 'cursor-grab' : ''
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Grid */}
        <GridOverlay
          width={containerWidth}
          height={height}
          offset={offset}
          scale={scale}
          visible={showGrid}
        />

        {/* Path preview (from any source: freehand, upload, or control points) */}
        <PathPreview
          points={points}
          offset={offset}
          scale={scale}
          showPoints={points.length <= 50}
        />

        {/* Freehand drawing tool */}
        <FreehandTool
          offset={offset}
          scale={scale}
          screenToWorld={screenToWorld}
          onStrokeComplete={handleStrokeComplete}
          active={activeTool === 'freehand' && !spaceHeld}
        />

        {/* Click-to-place points tool */}
        <PointPlaceTool
          offset={offset}
          scale={scale}
          screenToWorld={screenToWorld}
          snapToGrid={snapToGrid}
          controlPoints={controlPoints}
          onAddPoint={handleAddControlPoint}
          active={activeTool === 'point' && !spaceHeld}
        />

        {/* Point editor (select & drag) */}
        <PointEditor
          offset={offset}
          scale={scale}
          screenToWorld={screenToWorld}
          snapToGrid={snapToGrid}
          controlPoints={controlPoints}
          onUpdatePoint={handleUpdateControlPoint}
          onDeletePoint={handleDeleteControlPoint}
          active={activeTool === 'select' && !spaceHeld}
        />
      </svg>
    </div>
  );
}

/**
 * Sample a smooth Catmull-Rom spline through control points.
 * @param {Array<{x, y}>} cps - Control points
 * @param {number} numSamples - Number of output samples
 * @returns {Array<{x, y}>}
 */
function sampleBezierPath(cps, numSamples) {
  if (cps.length < 2) return [...cps];
  if (cps.length === 2) {
    // Linear interpolation
    const result = [];
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      result.push({
        x: cps[0].x + (cps[1].x - cps[0].x) * t,
        y: cps[0].y + (cps[1].y - cps[0].y) * t,
      });
    }
    return result;
  }

  const tension = 0.3;
  const result = [];
  const segments = cps.length - 1;
  const samplesPerSegment = Math.ceil(numSamples / segments);

  for (let seg = 0; seg < segments; seg++) {
    const p0 = cps[Math.max(0, seg - 1)];
    const p1 = cps[seg];
    const p2 = cps[seg + 1];
    const p3 = cps[Math.min(cps.length - 1, seg + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    const n = seg === segments - 1 ? samplesPerSegment : samplesPerSegment;
    for (let i = 0; i <= (seg === segments - 1 ? n : n - 1); i++) {
      const t = i / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      result.push({
        x: mt3 * p1.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * p2.x,
        y: mt3 * p1.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * p2.y,
      });
    }
  }

  return result;
}
