/**
 * Coordinate Transform Utilities
 *
 * SVG uses top-left origin with Y-down. Mechanism space uses standard
 * math convention with Y-up. These transforms handle the conversion.
 */

/**
 * Transform points from SVG coordinate space to mechanism (math) space.
 * SVG: origin top-left, Y increases downward.
 * Mechanism: origin bottom-left (of bounding box), Y increases upward.
 *
 * @param {Array<{x:number, y:number}>} points - Points in SVG coords
 * @param {object} [viewBox] - SVG viewBox { x, y, w, h }
 * @returns {Array<{x: number, y: number}>} - Points in mechanism space
 */
export function svgToMechanism(points, viewBox = null) {
  if (points.length === 0) return [];

  // Find bounding box of points
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);

  // Flip Y axis and shift to origin
  return points.map((p) => ({
    x: p.x - minX,
    y: maxY - p.y, // Flip Y
  }));
}

/**
 * Normalize points so the path fits within [0, targetSize] in both axes,
 * preserving aspect ratio.
 *
 * @param {Array<{x:number, y:number}>} points
 * @param {number} [targetSize=100] - Target extent
 * @param {boolean} [preserveAspect=true] - Uniform scaling
 * @returns {{ points: Array<{x:number, y:number}>, scaleFactor: number }}
 */
export function normalizePoints(points, targetSize = 100, preserveAspect = true) {
  if (points.length === 0) return { points: [], scaleFactor: 1 };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  let scaleFactor;
  if (preserveAspect) {
    scaleFactor = targetSize / Math.max(rangeX, rangeY);
  } else {
    scaleFactor = targetSize / rangeX; // Only scale by X
  }

  const normalized = points.map((p) => ({
    x: (p.x - minX) * scaleFactor,
    y: (p.y - minY) * scaleFactor,
  }));

  return { points: normalized, scaleFactor };
}

/**
 * Shift points so the first point is at the origin (0, 0).
 *
 * @param {Array<{x:number, y:number}>} points
 * @returns {Array<{x: number, y: number}>}
 */
export function shiftToOrigin(points) {
  if (points.length === 0) return [];
  const dx = points[0].x;
  const dy = points[0].y;
  return points.map((p) => ({ x: p.x - dx, y: p.y - dy }));
}

/**
 * Compute bounding box of a point set.
 *
 * @param {Array<{x:number, y:number}>} points
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, cx: number, cy: number }}
 */
export function boundingBox(points) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/**
 * Rotate points around a center by a given angle.
 *
 * @param {Array<{x:number, y:number}>} points
 * @param {number} angleDeg - Rotation angle in degrees
 * @param {{x:number, y:number}} [center={x:0,y:0}] - Center of rotation
 * @returns {Array<{x: number, y: number}>}
 */
export function rotatePoints(points, angleDeg, center = { x: 0, y: 0 }) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return points.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  });
}
