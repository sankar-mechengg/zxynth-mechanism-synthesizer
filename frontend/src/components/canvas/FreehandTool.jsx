import { useState, useCallback, useRef } from 'react';
import getStroke from 'perfect-freehand';

/**
 * Freehand drawing tool using perfect-freehand.
 * Captures mouse/touch input, renders a smooth stroke, and outputs sampled (x,y) points.
 *
 * Renders inside the canvas SVG. The parent DrawingCanvas decides when this tool is active.
 *
 * @param {object} props
 * @param {{x: number, y: number}} props.offset - Pan offset
 * @param {number} props.scale - Zoom scale
 * @param {function} props.screenToWorld - Convert screen → world coords
 * @param {function} props.onStrokeComplete - Called with Array<{x, y}> in world coords when stroke ends
 * @param {boolean} [props.active=false] - Whether this tool is currently active
 */
export default function FreehandTool({
  offset,
  scale,
  screenToWorld,
  onStrokeComplete,
  active = false,
}) {
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef(null);

  const getPointerPos = useCallback(
    (e) => {
      const svg = svgRef.current?.closest('svg');
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (!active || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getPointerPos(e);
      setCurrentPoints([[pos.x, pos.y, e.pressure || 0.5]]);
      setIsDrawing(true);
    },
    [active, getPointerPos]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPointerPos(e);
      setCurrentPoints((prev) => [...prev, [pos.x, pos.y, e.pressure || 0.5]]);
    },
    [isDrawing, getPointerPos]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length < 3) {
      setCurrentPoints([]);
      return;
    }

    // Sample the stroke path at regular intervals in world coordinates
    // Use the center line of the stroke (not the outlined shape)
    const worldPoints = currentPoints.map(([sx, sy]) => screenToWorld(sx, sy));

    // Resample to reasonable density: ~2 world units between points
    const resampled = resamplePath(worldPoints, 2);

    if (resampled.length >= 2) {
      onStrokeComplete?.(resampled);
    }

    setCurrentPoints([]);
  }, [isDrawing, currentPoints, screenToWorld, onStrokeComplete]);

  // Generate the SVG path from perfect-freehand
  const strokePath = currentPoints.length >= 2
    ? getSvgPathFromStroke(
        getStroke(currentPoints, {
          size: 3,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        })
      )
    : '';

  if (!active) return null;

  return (
    <g
      ref={svgRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: 'crosshair' }}
    >
      {/* Transparent capture rect */}
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="transparent"
      />

      {/* Current stroke being drawn */}
      {strokePath && (
        <path
          d={strokePath}
          fill="#f472b6"
          opacity={0.7}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/**
 * Convert perfect-freehand outline points to an SVG path d-string.
 */
function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

/**
 * Resample a path to approximately uniform spacing.
 * @param {Array<{x, y}>} points - Input points
 * @param {number} spacing - Desired spacing in world units
 * @returns {Array<{x, y}>}
 */
function resamplePath(points, spacing) {
  if (points.length < 2) return [...points];

  const result = [{ ...points[0] }];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    accumulated += segLen;

    if (accumulated >= spacing) {
      result.push({ x: points[i].x, y: points[i].y });
      accumulated = 0;
    }
  }

  // Always include last point
  const last = points[points.length - 1];
  const prevResult = result[result.length - 1];
  if (Math.abs(last.x - prevResult.x) > 0.01 || Math.abs(last.y - prevResult.y) > 0.01) {
    result.push({ ...last });
  }

  return result;
}
