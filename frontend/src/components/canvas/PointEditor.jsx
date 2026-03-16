import { useState, useCallback, useRef } from 'react';
import clsx from 'clsx';

/**
 * Point editing tool — allows dragging control points to new positions.
 * Shows coordinate readout on hover/drag.
 *
 * @param {object} props
 * @param {{x: number, y: number}} props.offset - Pan offset
 * @param {number} props.scale - Zoom scale
 * @param {function} props.screenToWorld - Convert screen → world coords
 * @param {function} props.snapToGrid - Snap world coords to grid
 * @param {Array<{x: number, y: number}>} props.controlPoints - Control points in world coords
 * @param {function} props.onUpdatePoint - Called with (index, {x, y}) when a point is moved
 * @param {function} props.onDeletePoint - Called with (index) to remove a point
 * @param {boolean} [props.active=false] - Whether this tool is active
 */
export default function PointEditor({
  offset,
  scale,
  screenToWorld,
  snapToGrid,
  controlPoints = [],
  onUpdatePoint,
  onDeletePoint,
  active = false,
}) {
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const dragStartRef = useRef(null);

  const handlePointerDown = useCallback(
    (e, index) => {
      if (!active || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      setDraggingIdx(index);
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const handleMove = (moveEvent) => {
        const svg = e.target.closest('svg');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const sx = moveEvent.clientX - rect.left;
        const sy = moveEvent.clientY - rect.top;
        let world = screenToWorld(sx, sy);
        world = snapToGrid(world.x, world.y);
        onUpdatePoint?.(index, world);
      };

      const handleUp = () => {
        setDraggingIdx(null);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [active, screenToWorld, snapToGrid, onUpdatePoint]
  );

  const handleDoubleClick = useCallback(
    (e, index) => {
      e.preventDefault();
      e.stopPropagation();
      onDeletePoint?.(index);
    },
    [onDeletePoint]
  );

  if (!active || controlPoints.length === 0) return null;

  const hitRadius = 12;

  return (
    <g>
      {controlPoints.map((p, i) => {
        const sx = p.x * scale + offset.x;
        const sy = p.y * scale + offset.y;
        const isDragging = draggingIdx === i;
        const isHovered = hoveredIdx === i;

        return (
          <g key={i}>
            {/* Larger invisible hit area */}
            <circle
              cx={sx} cy={sy}
              r={hitRadius}
              fill="transparent"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerEnter={() => setHoveredIdx(i)}
              onPointerLeave={() => setHoveredIdx(null)}
              onDoubleClick={(e) => handleDoubleClick(e, i)}
            />

            {/* Selection ring (hovered or dragging) */}
            {(isHovered || isDragging) && (
              <circle
                cx={sx} cy={sy}
                r={10}
                fill="none"
                stroke="#3170e3"
                strokeWidth={1.5}
                strokeDasharray="3 2"
                className="pointer-events-none"
                opacity={0.6}
              />
            )}

            {/* Point dot */}
            <circle
              cx={sx} cy={sy}
              r={isDragging ? 6 : 5}
              fill={i === 0 ? '#34d399' : i === controlPoints.length - 1 ? '#f59e0b' : '#f472b6'}
              stroke="var(--color-bg-primary)"
              strokeWidth={2}
              className="pointer-events-none transition-all duration-100"
            />

            {/* Coordinate readout — shown on hover or drag */}
            {(isHovered || isDragging) && (
              <g className="pointer-events-none">
                <rect
                  x={sx + 14}
                  y={sy - 22}
                  width={90}
                  height={20}
                  rx={4}
                  fill="var(--color-bg-elevated)"
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  opacity={0.95}
                />
                <text
                  x={sx + 18}
                  y={sy - 9}
                  fill="var(--color-text-secondary)"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                </text>
              </g>
            )}

            {/* Index label */}
            <text
              x={sx - 3}
              y={sy - 10}
              fill="var(--color-text-muted)"
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
              className="pointer-events-none"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
}
