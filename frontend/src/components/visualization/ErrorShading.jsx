import { useMemo } from 'react';

/**
 * Renders error shading between desired path and actual coupler curve.
 * Creates a filled polygon showing the deviation region.
 *
 * @param {object} props
 * @param {Array<{x:number,y:number}>} props.desiredPath - Desired path (screen coords)
 * @param {Array<{x:number,y:number}>} props.actualCurve - Actual coupler curve (screen coords)
 * @param {boolean} [props.visible=true]
 * @param {number} [props.opacity=0.15]
 */
export default function ErrorShading({
  desiredPath = [],
  actualCurve = [],
  visible = true,
  opacity = 0.15,
}) {
  // Build matched point pairs for error shading
  const shadingPaths = useMemo(() => {
    if (!visible || desiredPath.length < 2 || actualCurve.length < 2) return [];

    // For each desired point, find the closest actual point
    const paths = [];
    const step = Math.max(1, Math.floor(desiredPath.length / 40)); // Sample every ~40 segments

    for (let i = 0; i < desiredPath.length; i += step) {
      const dp = desiredPath[i];
      let minDist = Infinity;
      let closest = actualCurve[0];

      for (const ap of actualCurve) {
        const dx = dp.x - ap.x;
        const dy = dp.y - ap.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closest = ap;
        }
      }

      // Only show shading if error is visually meaningful (> 2px)
      if (Math.sqrt(minDist) > 2) {
        paths.push({ desired: dp, actual: closest, error: Math.sqrt(minDist) });
      }
    }

    return paths;
  }, [desiredPath, actualCurve, visible]);

  if (!visible || shadingPaths.length === 0) return null;

  // Build a filled polygon connecting desired → actual → back
  // Use a ribbon approach: desired forward, actual backward
  const maxError = Math.max(...shadingPaths.map((p) => p.error));

  return (
    <g className="pointer-events-none">
      {/* Error connection lines */}
      {shadingPaths.map((pair, i) => {
        // Color intensity based on error magnitude
        const intensity = Math.min(1, pair.error / Math.max(maxError, 1));
        const red = Math.round(239 * intensity);
        const alpha = 0.1 + intensity * 0.25;

        return (
          <g key={i}>
            {/* Error line connecting desired to closest actual */}
            <line
              x1={pair.desired.x} y1={pair.desired.y}
              x2={pair.actual.x} y2={pair.actual.y}
              stroke={`rgba(${red}, 68, 68, ${alpha})`}
              strokeWidth={1}
            />
            {/* Error dot at midpoint */}
            <circle
              cx={(pair.desired.x + pair.actual.x) / 2}
              cy={(pair.desired.y + pair.actual.y) / 2}
              r={Math.max(1, Math.min(4, pair.error / 5))}
              fill={`rgba(239, 68, 68, ${alpha * 1.5})`}
            />
          </g>
        );
      })}

      {/* Semi-transparent filled region between curves */}
      {desiredPath.length > 2 && actualCurve.length > 2 && (
        <polygon
          points={[
            ...desiredPath.map((p) => `${p.x},${p.y}`),
            ...actualCurve.slice().reverse().map((p) => `${p.x},${p.y}`),
          ].join(' ')}
          fill="#ef4444"
          opacity={opacity}
          strokeWidth={0}
        />
      )}
    </g>
  );
}
