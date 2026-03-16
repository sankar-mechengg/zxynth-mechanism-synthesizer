import clsx from 'clsx';
import { COLORS } from '../../config/api';

/**
 * Renders a single mechanism link as an SVG line with optional label.
 *
 * @param {object} props
 * @param {{x:number,y:number}} props.start - Start joint position (screen coords)
 * @param {{x:number,y:number}} props.end - End joint position (screen coords)
 * @param {number} props.linkIndex - Link number (1-based)
 * @param {boolean} [props.isGround=false] - Whether this is the ground link
 * @param {boolean} [props.isCoupler=false] - Whether this is the coupler link
 * @param {boolean} [props.showLabel=true] - Show link label
 * @param {number} [props.strokeWidth=3] - Line stroke width
 */
export default function LinkRenderer({
  start,
  end,
  linkIndex,
  isGround = false,
  isCoupler = false,
  showLabel = true,
  strokeWidth = 3,
}) {
  if (!start || !end) return null;

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Color based on link type
  let strokeColor = COLORS.link;
  if (isGround) strokeColor = COLORS.ground;
  if (isCoupler) strokeColor = COLORS.coupler;

  // Angle for label offset
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle) * 12;
  const perpY = Math.cos(angle) * 12;

  return (
    <g>
      {/* Ground link hatching */}
      {isGround && (
        <line
          x1={start.x} y1={start.y}
          x2={end.x} y2={end.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          opacity={0.1}
        />
      )}

      {/* Link line */}
      <line
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={isGround ? 0.6 : 0.9}
        strokeDasharray={isGround ? '8 4' : 'none'}
      />

      {/* Link label */}
      {showLabel && (
        <g>
          <rect
            x={midX + perpX - 11}
            y={midY + perpY - 8}
            width={22}
            height={16}
            rx={4}
            fill="var(--color-bg-elevated)"
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.9}
          />
          <text
            x={midX + perpX}
            y={midY + perpY + 4}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill={strokeColor}
            fontFamily="JetBrains Mono, monospace"
          >
            L{linkIndex}
          </text>
        </g>
      )}
    </g>
  );
}
