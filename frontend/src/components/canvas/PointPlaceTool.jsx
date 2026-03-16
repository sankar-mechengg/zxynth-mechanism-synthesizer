import { useCallback, useRef } from 'react';

/**
 * Click-to-place point tool with cubic Bézier interpolation.
 * User clicks to place control points; a smooth Bézier curve is fit through them.
 *
 * @param {object} props
 * @param {{x: number, y: number}} props.offset - Pan offset
 * @param {number} props.scale - Zoom scale
 * @param {function} props.screenToWorld - Convert screen → world coords
 * @param {function} props.snapToGrid - Snap world coords to grid
 * @param {Array<{x: number, y: number}>} props.controlPoints - Current control points (world coords)
 * @param {function} props.onAddPoint - Called with {x, y} in world coords when user clicks
 * @param {boolean} [props.active=false] - Whether this tool is active
 */
export default function PointPlaceTool({
  offset,
  scale,
  screenToWorld,
  snapToGrid,
  controlPoints = [],
  onAddPoint,
  active = false,
}) {
  const svgRef = useRef(null);

  const handleClick = useCallback(
    (e) => {
      if (!active || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current?.closest('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      let world = screenToWorld(sx, sy);
      world = snapToGrid(world.x, world.y);
      onAddPoint?.(world);
    },
    [active, screenToWorld, snapToGrid, onAddPoint]
  );

  if (!active) return null;

  // Generate smooth Bézier path through control points
  const bezierPath = controlPoints.length >= 2
    ? generateBezierPath(controlPoints, offset, scale)
    : '';

  return (
    <g ref={svgRef} onClick={handleClick} style={{ cursor: 'crosshair' }}>
      {/* Transparent capture rect */}
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

      {/* Bézier curve through control points */}
      {bezierPath && (
        <path
          d={bezierPath}
          fill="none"
          stroke="#f472b6"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.8}
        />
      )}

      {/* Control point markers */}
      {controlPoints.map((p, i) => {
        const sx = p.x * scale + offset.x;
        const sy = p.y * scale + offset.y;
        return (
          <g key={i}>
            {/* Outer ring */}
            <circle
              cx={sx} cy={sy} r={7}
              fill="none"
              stroke="#f472b6"
              strokeWidth={1.5}
              opacity={0.4}
            />
            {/* Inner dot */}
            <circle
              cx={sx} cy={sy} r={4}
              fill={i === 0 ? '#34d399' : i === controlPoints.length - 1 ? '#f59e0b' : '#f472b6'}
              stroke="var(--color-bg-primary)"
              strokeWidth={1.5}
            />
            {/* Index label */}
            <text
              x={sx + 10} y={sy - 6}
              fill="var(--color-text-muted)"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              P{i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Generate a smooth cubic Bézier SVG path through a set of control points
 * using Catmull-Rom → Bézier conversion.
 *
 * @param {Array<{x, y}>} points - Control points in world coords
 * @param {{x, y}} offset - Pan offset
 * @param {number} scale - Zoom scale
 * @returns {string} SVG path d-string
 */
function generateBezierPath(points, offset, scale) {
  if (points.length < 2) return '';

  // Convert to screen coords
  const sp = points.map((p) => ({
    x: p.x * scale + offset.x,
    y: p.y * scale + offset.y,
  }));

  if (sp.length === 2) {
    return `M ${sp[0].x} ${sp[0].y} L ${sp[1].x} ${sp[1].y}`;
  }

  // Catmull-Rom to cubic Bézier conversion
  // Tension factor (0 = sharp, 1 = very smooth)
  const tension = 0.3;
  let d = `M ${sp[0].x} ${sp[0].y}`;

  for (let i = 0; i < sp.length - 1; i++) {
    const p0 = sp[Math.max(0, i - 1)];
    const p1 = sp[i];
    const p2 = sp[i + 1];
    const p3 = sp[Math.min(sp.length - 1, i + 2)];

    // Control point 1
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;

    // Control point 2
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}
