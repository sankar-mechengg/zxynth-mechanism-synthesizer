import clsx from 'clsx';

/**
 * Renders a path as an SVG polyline with optional point markers.
 * Used inside the DrawingCanvas SVG to show the current drawn/uploaded path.
 *
 * @param {object} props
 * @param {Array<{x: number, y: number}>} props.points - Path points in world coordinates
 * @param {{x: number, y: number}} props.offset - Pan offset
 * @param {number} props.scale - Zoom scale
 * @param {string} [props.strokeColor] - Path stroke color
 * @param {number} [props.strokeWidth=2] - Stroke width in screen pixels
 * @param {boolean} [props.showPoints=false] - Show individual point markers
 * @param {boolean} [props.dashed=false] - Use dashed stroke
 * @param {string} [props.className] - Additional classes on the group
 */
export default function PathPreview({
  points = [],
  offset,
  scale,
  strokeColor = '#f472b6',
  strokeWidth = 2,
  showPoints = false,
  dashed = false,
  className = '',
}) {
  if (points.length < 2) {
    // Show individual points if less than 2
    if (points.length === 1 && showPoints) {
      const sx = points[0].x * scale + offset.x;
      const sy = points[0].y * scale + offset.y;
      return (
        <circle
          cx={sx} cy={sy} r={4}
          fill={strokeColor} opacity={0.8}
        />
      );
    }
    return null;
  }

  // Build polyline string
  const polylineStr = points
    .map((p) => {
      const sx = p.x * scale + offset.x;
      const sy = p.y * scale + offset.y;
      return `${sx},${sy}`;
    })
    .join(' ');

  // Point marker radius in screen pixels
  const markerR = Math.max(2, Math.min(4, 3 / Math.sqrt(scale)));

  return (
    <g className={clsx('pointer-events-none', className)}>
      {/* Path line */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? '6 4' : 'none'}
        opacity={0.9}
      />

      {/* Point markers */}
      {showPoints &&
        points.map((p, i) => {
          const sx = p.x * scale + offset.x;
          const sy = p.y * scale + offset.y;
          return (
            <circle
              key={i}
              cx={sx}
              cy={sy}
              r={markerR}
              fill={strokeColor}
              opacity={0.6}
            />
          );
        })}

      {/* Start/end markers */}
      {points.length > 1 && (
        <>
          {/* Start — green */}
          <circle
            cx={points[0].x * scale + offset.x}
            cy={points[0].y * scale + offset.y}
            r={5}
            fill="#34d399"
            stroke="#0a0e1a"
            strokeWidth={1.5}
          />
          {/* End — amber */}
          <circle
            cx={points[points.length - 1].x * scale + offset.x}
            cy={points[points.length - 1].y * scale + offset.y}
            r={5}
            fill="#f59e0b"
            stroke="#0a0e1a"
            strokeWidth={1.5}
          />
        </>
      )}
    </g>
  );
}
