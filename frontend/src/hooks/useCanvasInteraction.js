import { useState, useCallback, useRef } from 'react';

/**
 * Hook for canvas pan/zoom/snap interactions.
 *
 * Manages a view transform (offset + scale) and provides:
 * - Mouse wheel zoom (centered on cursor)
 * - Middle-click or Space+drag pan
 * - Screen ↔ world coordinate conversion
 * - Grid snapping
 *
 * @param {object} options
 * @param {number} [options.minZoom=0.1] - Minimum zoom scale
 * @param {number} [options.maxZoom=10] - Maximum zoom scale
 * @param {number} [options.gridSize=20] - Grid snap size (0 to disable)
 * @param {boolean} [options.snapEnabled=false] - Whether snapping is active
 */
export default function useCanvasInteraction({
  minZoom = 0.1,
  maxZoom = 10,
  gridSize = 20,
  snapEnabled = false,
} = {}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  /**
   * Convert screen pixel coords to world (mechanism) coords.
   */
  const screenToWorld = useCallback(
    (sx, sy) => ({
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale,
    }),
    [offset, scale]
  );

  /**
   * Convert world coords back to screen pixels.
   */
  const worldToScreen = useCallback(
    (wx, wy) => ({
      x: wx * scale + offset.x,
      y: wy * scale + offset.y,
    }),
    [offset, scale]
  );

  /**
   * Snap a world coordinate to the nearest grid point.
   */
  const snapToGrid = useCallback(
    (wx, wy) => {
      if (!snapEnabled || gridSize <= 0) return { x: wx, y: wy };
      return {
        x: Math.round(wx / gridSize) * gridSize,
        y: Math.round(wy / gridSize) * gridSize,
      };
    },
    [snapEnabled, gridSize]
  );

  /**
   * Handle mouse wheel zoom, centered on cursor position.
   */
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.min(maxZoom, Math.max(minZoom, scale * zoomFactor));

      // Adjust offset so zoom centers on cursor
      const newOffset = {
        x: mx - (mx - offset.x) * (newScale / scale),
        y: my - (my - offset.y) * (newScale / scale),
      };

      setScale(newScale);
      setOffset(newOffset);
    },
    [scale, offset, minZoom, maxZoom]
  );

  /**
   * Start panning (middle-click or space+click).
   */
  const handlePanStart = useCallback(
    (e) => {
      // Middle mouse button (button=1) or space key held
      if (e.button === 1 || e._forcePan) {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
      }
    },
    [offset]
  );

  /**
   * Continue panning.
   */
  const handlePanMove = useCallback(
    (e) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setOffset({
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      });
    },
    []
  );

  /**
   * End panning.
   */
  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  /**
   * Reset view to origin.
   */
  const resetView = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  }, []);

  /**
   * Fit view to show a bounding box [minX, minY, maxX, maxY] in the canvas.
   */
  const fitToBounds = useCallback(
    (bounds, canvasWidth, canvasHeight, padding = 40) => {
      const [minX, minY, maxX, maxY] = bounds;
      const w = maxX - minX || 1;
      const h = maxY - minY || 1;
      const sx = (canvasWidth - padding * 2) / w;
      const sy = (canvasHeight - padding * 2) / h;
      const newScale = Math.min(sx, sy, maxZoom);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      setScale(newScale);
      setOffset({
        x: canvasWidth / 2 - cx * newScale,
        y: canvasHeight / 2 - cy * newScale,
      });
    },
    [maxZoom]
  );

  return {
    offset,
    scale,
    isPanning: isPanning.current,
    screenToWorld,
    worldToScreen,
    snapToGrid,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
    fitToBounds,
    setOffset,
    setScale,
  };
}
