import { useMemo } from 'react';

/**
 * Engineering-style grid overlay rendered inside the canvas SVG.
 * Major lines every 100 units, minor lines every 20 units (in world space).
 * Grid density adapts to zoom level.
 *
 * @param {object} props
 * @param {number} props.width - Canvas width in pixels
 * @param {number} props.height - Canvas height in pixels
 * @param {{x: number, y: number}} props.offset - Pan offset
 * @param {number} props.scale - Zoom scale
 * @param {boolean} [props.visible=true] - Show/hide grid
 */
export default function GridOverlay({
  width,
  height,
  offset,
  scale,
  visible = true,
}) {
  const { minorLines, majorLines, axisLines } = useMemo(() => {
    if (!visible) return { minorLines: [], majorLines: [], axisLines: [] };

    const minor = [];
    const major = [];
    const axes = [];

    // Determine grid spacing in world units that looks good at current zoom
    let minorSpacing = 20;
    let majorSpacing = 100;

    // Adaptive: if zoomed out too far, increase spacing
    const screenMinor = minorSpacing * scale;
    if (screenMinor < 8) {
      minorSpacing = 100;
      majorSpacing = 500;
    } else if (screenMinor < 15) {
      minorSpacing = 50;
      majorSpacing = 250;
    }

    // Visible world-space range
    const worldLeft = -offset.x / scale;
    const worldTop = -offset.y / scale;
    const worldRight = (width - offset.x) / scale;
    const worldBottom = (height - offset.y) / scale;

    // Minor grid lines (vertical)
    const startX = Math.floor(worldLeft / minorSpacing) * minorSpacing;
    for (let x = startX; x <= worldRight; x += minorSpacing) {
      const sx = x * scale + offset.x;
      const isMajor = Math.abs(x % majorSpacing) < 0.01;
      const isAxis = Math.abs(x) < 0.01;

      if (isAxis) {
        axes.push({ x1: sx, y1: 0, x2: sx, y2: height, dir: 'v' });
      } else if (isMajor) {
        major.push({ x1: sx, y1: 0, x2: sx, y2: height });
      } else {
        minor.push({ x1: sx, y1: 0, x2: sx, y2: height });
      }
    }

    // Minor grid lines (horizontal)
    const startY = Math.floor(worldTop / minorSpacing) * minorSpacing;
    for (let y = startY; y <= worldBottom; y += minorSpacing) {
      const sy = y * scale + offset.y;
      const isMajor = Math.abs(y % majorSpacing) < 0.01;
      const isAxis = Math.abs(y) < 0.01;

      if (isAxis) {
        axes.push({ x1: 0, y1: sy, x2: width, y2: sy, dir: 'h' });
      } else if (isMajor) {
        major.push({ x1: 0, y1: sy, x2: width, y2: sy });
      } else {
        minor.push({ x1: 0, y1: sy, x2: width, y2: sy });
      }
    }

    return { minorLines: minor, majorLines: major, axisLines: axes };
  }, [width, height, offset.x, offset.y, scale, visible]);

  if (!visible) return null;

  return (
    <g className="pointer-events-none">
      {/* Minor grid */}
      {minorLines.map((l, i) => (
        <line
          key={`m${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="var(--grid-minor)"
          strokeWidth="1"
        />
      ))}

      {/* Major grid */}
      {majorLines.map((l, i) => (
        <line
          key={`M${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="var(--grid-major)"
          strokeWidth="1"
        />
      ))}

      {/* Axes (origin) */}
      {axisLines.map((l, i) => (
        <line
          key={`a${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="var(--color-accent)"
          strokeWidth="1"
          opacity="0.25"
        />
      ))}
    </g>
  );
}
