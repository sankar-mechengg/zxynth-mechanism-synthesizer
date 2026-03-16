import { COLORS } from '../../config/api';

/**
 * Renders a single mechanism joint as an SVG marker with label.
 *
 * @param {object} props
 * @param {{x:number,y:number}} props.position - Joint position (screen coords)
 * @param {number} props.jointIndex - Joint number (1-based)
 * @param {'revolute'|'prismatic'|'ground'} [props.type='revolute'] - Joint type
 * @param {boolean} [props.isFixed=false] - Whether this is a ground-fixed joint
 * @param {boolean} [props.showLabel=true] - Show joint label
 * @param {number} [props.radius=6] - Joint marker radius
 */
export default function JointRenderer({
  position,
  jointIndex,
  type = 'revolute',
  isFixed = false,
  showLabel = true,
  radius = 6,
}) {
  if (!position) return null;

  const { x, y } = position;
  const color = isFixed ? COLORS.ground : COLORS.joint;

  return (
    <g>
      {/* Ground triangle for fixed joints */}
      {isFixed && (
        <g>
          {/* Hatching lines below joint */}
          <line x1={x - 10} y1={y + radius + 3} x2={x + 10} y2={y + radius + 3}
            stroke={COLORS.ground} strokeWidth={1.5} />
          {[-8, -4, 0, 4, 8].map((dx, i) => (
            <line
              key={i}
              x1={x + dx} y1={y + radius + 3}
              x2={x + dx - 4} y2={y + radius + 9}
              stroke={COLORS.ground} strokeWidth={1} opacity={0.5}
            />
          ))}
        </g>
      )}

      {type === 'revolute' ? (
        /* Revolute joint — filled circle with ring */
        <>
          <circle cx={x} cy={y} r={radius + 2}
            fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
          <circle cx={x} cy={y} r={radius}
            fill="var(--color-bg-primary)" stroke={color} strokeWidth={2} />
          <circle cx={x} cy={y} r={2.5}
            fill={color} />
        </>
      ) : (
        /* Prismatic joint — rectangle with arrow */
        <>
          <rect
            x={x - radius - 2} y={y - radius}
            width={radius * 2 + 4} height={radius * 2}
            rx={3}
            fill="var(--color-bg-primary)" stroke={color} strokeWidth={2}
          />
          {/* Sliding direction arrow */}
          <line x1={x - 4} y1={y} x2={x + 4} y2={y}
            stroke={color} strokeWidth={1.5} />
          <polygon
            points={`${x + 4},${y - 2} ${x + 7},${y} ${x + 4},${y + 2}`}
            fill={color}
          />
        </>
      )}

      {/* Joint label */}
      {showLabel && (
        <text
          x={x}
          y={y - radius - 6}
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill={color}
          fontFamily="JetBrains Mono, monospace"
        >
          J{jointIndex}
        </text>
      )}
    </g>
  );
}
