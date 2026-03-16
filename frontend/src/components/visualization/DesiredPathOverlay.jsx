/**
 * Renders the desired/target path as a dashed overlay.
 *
 * @param {object} props
 * @param {Array<{x:number,y:number}>} props.path - Desired path points (screen coords)
 * @param {boolean} [props.visible=true]
 * @param {boolean} [props.showPoints=false] - Show individual point markers
 */
export default function DesiredPathOverlay({
  path = [],
  visible = true,
  showPoints = false,
}) {
  if (!visible || path.length < 2) return null;

  const polyStr = path.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <g className="pointer-events-none">
      {/* Dashed desired path */}
      <polyline
        points={polyStr}
        fill="none"
        stroke="#f472b6"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Point markers */}
      {showPoints && path.length <= 50 && path.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={2}
          fill="#f472b6"
          opacity={0.4}
        />
      ))}

      {/* Start marker */}
      <circle
        cx={path[0].x} cy={path[0].y}
        r={4}
        fill="none"
        stroke="#f472b6"
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* End marker */}
      <circle
        cx={path[path.length - 1].x}
        cy={path[path.length - 1].y}
        r={4}
        fill="#f472b6"
        opacity={0.4}
      />

      {/* Label */}
      <text
        x={path[0].x + 8}
        y={path[0].y - 8}
        fontSize="9"
        fill="#f472b6"
        opacity={0.6}
        fontFamily="JetBrains Mono, monospace"
      >
        desired
      </text>
    </g>
  );
}
