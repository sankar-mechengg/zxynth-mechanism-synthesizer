/**
 * Bézier Curve Utilities
 * Cubic Bézier fitting through points, evaluation, tangent computation,
 * and arc-length parameterization.
 */

/**
 * Evaluate a cubic Bézier curve at parameter t.
 *
 * @param {{x:number,y:number}} p0 - Start point
 * @param {{x:number,y:number}} p1 - Control point 1
 * @param {{x:number,y:number}} p2 - Control point 2
 * @param {{x:number,y:number}} p3 - End point
 * @param {number} t - Parameter [0, 1]
 * @returns {{x: number, y: number}}
 */
export function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Compute the tangent (first derivative) of a cubic Bézier at parameter t.
 *
 * @returns {{x: number, y: number}} - Tangent vector (not normalized)
 */
export function cubicBezierTangent(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
    y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
  };
}

/**
 * Fit a Catmull-Rom spline through control points and convert to cubic Bézier segments.
 *
 * @param {Array<{x:number, y:number}>} points - Through-points
 * @param {number} [tension=0.3] - Tension factor (0 = sharp, 1 = very smooth)
 * @returns {Array<{p0, p1, p2, p3}>} - Array of cubic Bézier segments
 */
export function fitCatmullRomBezier(points, tension = 0.3) {
  if (points.length < 2) return [];

  const segments = [];

  for (let i = 0; i < points.length - 1; i++) {
    const prev = points[Math.max(0, i - 1)];
    const curr = points[i];
    const next = points[i + 1];
    const next2 = points[Math.min(points.length - 1, i + 2)];

    segments.push({
      p0: curr,
      p1: {
        x: curr.x + (next.x - prev.x) * tension,
        y: curr.y + (next.y - prev.y) * tension,
      },
      p2: {
        x: next.x - (next2.x - curr.x) * tension,
        y: next.y - (next2.y - curr.y) * tension,
      },
      p3: next,
    });
  }

  return segments;
}

/**
 * Sample a piecewise Catmull-Rom/Bézier spline at N points with uniform arc-length.
 *
 * @param {Array<{x:number, y:number}>} controlPoints - Through-points
 * @param {number} numSamples - Number of output points
 * @param {number} [tension=0.3]
 * @returns {Array<{x: number, y: number}>}
 */
export function sampleSplineUniform(controlPoints, numSamples, tension = 0.3) {
  const segments = fitCatmullRomBezier(controlPoints, tension);
  if (segments.length === 0) return [...controlPoints];

  // Dense sampling for arc-length computation
  const dense = [];
  const stepsPerSeg = 50;

  for (const seg of segments) {
    for (let i = 0; i <= stepsPerSeg; i++) {
      const t = i / stepsPerSeg;
      dense.push(cubicBezierPoint(seg.p0, seg.p1, seg.p2, seg.p3, t));
    }
  }

  // Remove duplicates at segment boundaries
  const cleaned = [dense[0]];
  for (let i = 1; i < dense.length; i++) {
    const dx = dense[i].x - cleaned[cleaned.length - 1].x;
    const dy = dense[i].y - cleaned[cleaned.length - 1].y;
    if (dx * dx + dy * dy > 1e-10) {
      cleaned.push(dense[i]);
    }
  }

  return resampleByArcLength(cleaned, numSamples);
}

/**
 * Resample a polyline to have uniform arc-length spacing.
 *
 * @param {Array<{x:number, y:number}>} points - Dense input polyline
 * @param {number} n - Output point count
 * @returns {Array<{x: number, y: number}>}
 */
export function resampleByArcLength(points, n) {
  if (points.length < 2 || n < 2) return [...points];

  // Compute cumulative arc lengths
  const arcLens = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    arcLens.push(arcLens[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }

  const totalLen = arcLens[arcLens.length - 1];
  if (totalLen === 0) return [points[0]];

  const result = [];
  let j = 0;

  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * totalLen;

    // Advance j to the segment containing target
    while (j < arcLens.length - 2 && arcLens[j + 1] < target) j++;

    const segLen = arcLens[j + 1] - arcLens[j];
    const frac = segLen > 0 ? (target - arcLens[j]) / segLen : 0;

    result.push({
      x: points[j].x + (points[j + 1].x - points[j].x) * frac,
      y: points[j].y + (points[j + 1].y - points[j].y) * frac,
    });
  }

  return result;
}

/**
 * Compute the total arc length of a point sequence.
 *
 * @param {Array<{x:number, y:number}>} points
 * @returns {number}
 */
export function arcLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}
