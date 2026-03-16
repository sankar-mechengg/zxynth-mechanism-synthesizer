/**
 * SVG Path Parser
 * Extracts path data from SVG content and samples it into discrete (x,y) points.
 * Handles: M, L, C, Q, A, Z commands (absolute and relative).
 */

/**
 * Parse SVG string content and extract sampled points from <path> elements.
 *
 * @param {string} svgContent - Raw SVG file content
 * @param {number} [numSamples=101] - Number of points to sample along the path
 * @returns {{ points: Array<{x: number, y: number}>, viewBox: {x:number,y:number,w:number,h:number}|null, rawPath: string }}
 */
export function parseSvg(svgContent, numSamples = 101) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  // Check for parse errors
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Invalid SVG: XML parse error');
  }

  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error('No <svg> element found');

  // Extract viewBox
  let viewBox = null;
  const vb = svgEl.getAttribute('viewBox');
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      viewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
  }

  // Find the first <path> element (search nested groups too)
  const pathEl = doc.querySelector('path');
  if (!pathEl) throw new Error('No <path> element found in SVG');

  const rawPath = pathEl.getAttribute('d') || '';
  if (!rawPath.trim()) throw new Error('Path d attribute is empty');

  // Parse and sample the path
  const segments = parsePathCommands(rawPath);
  const points = sampleSegments(segments, numSamples);

  return { points, viewBox, rawPath };
}

/**
 * Parse SVG path d-attribute into segment objects.
 */
function parsePathCommands(d) {
  const segments = [];
  // Tokenize: split into commands and their numeric arguments
  const tokens = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

  let cx = 0, cy = 0; // Current point
  let sx = 0, sy = 0; // Subpath start

  for (const token of tokens) {
    const cmd = token[0];
    const nums = (token.slice(1).match(/-?[\d.]+(?:e[+-]?\d+)?/gi) || []).map(Number);
    const isRel = cmd === cmd.toLowerCase();
    const CMD = cmd.toUpperCase();

    if (CMD === 'M') {
      // MoveTo
      const x = isRel ? cx + nums[0] : nums[0];
      const y = isRel ? cy + nums[1] : nums[1];
      cx = x; cy = y;
      sx = x; sy = y;
      segments.push({ type: 'M', x, y });
      // Implicit LineTo for remaining pairs
      for (let i = 2; i < nums.length; i += 2) {
        const lx = isRel ? cx + nums[i] : nums[i];
        const ly = isRel ? cy + nums[i + 1] : nums[i + 1];
        segments.push({ type: 'L', x1: cx, y1: cy, x2: lx, y2: ly });
        cx = lx; cy = ly;
      }
    } else if (CMD === 'L') {
      for (let i = 0; i < nums.length; i += 2) {
        const x = isRel ? cx + nums[i] : nums[i];
        const y = isRel ? cy + nums[i + 1] : nums[i + 1];
        segments.push({ type: 'L', x1: cx, y1: cy, x2: x, y2: y });
        cx = x; cy = y;
      }
    } else if (CMD === 'H') {
      for (const n of nums) {
        const x = isRel ? cx + n : n;
        segments.push({ type: 'L', x1: cx, y1: cy, x2: x, y2: cy });
        cx = x;
      }
    } else if (CMD === 'V') {
      for (const n of nums) {
        const y = isRel ? cy + n : n;
        segments.push({ type: 'L', x1: cx, y1: cy, x2: cx, y2: y });
        cy = y;
      }
    } else if (CMD === 'C') {
      // Cubic Bézier
      for (let i = 0; i < nums.length; i += 6) {
        const cp1x = isRel ? cx + nums[i] : nums[i];
        const cp1y = isRel ? cy + nums[i + 1] : nums[i + 1];
        const cp2x = isRel ? cx + nums[i + 2] : nums[i + 2];
        const cp2y = isRel ? cy + nums[i + 3] : nums[i + 3];
        const ex = isRel ? cx + nums[i + 4] : nums[i + 4];
        const ey = isRel ? cy + nums[i + 5] : nums[i + 5];
        segments.push({
          type: 'C', x1: cx, y1: cy,
          cp1x, cp1y, cp2x, cp2y,
          x2: ex, y2: ey,
        });
        cx = ex; cy = ey;
      }
    } else if (CMD === 'Q') {
      // Quadratic Bézier
      for (let i = 0; i < nums.length; i += 4) {
        const cpx = isRel ? cx + nums[i] : nums[i];
        const cpy = isRel ? cy + nums[i + 1] : nums[i + 1];
        const ex = isRel ? cx + nums[i + 2] : nums[i + 2];
        const ey = isRel ? cy + nums[i + 3] : nums[i + 3];
        segments.push({
          type: 'Q', x1: cx, y1: cy,
          cpx, cpy,
          x2: ex, y2: ey,
        });
        cx = ex; cy = ey;
      }
    } else if (CMD === 'A') {
      // Arc
      for (let i = 0; i < nums.length; i += 7) {
        const rx = nums[i], ry = nums[i + 1];
        const rotation = nums[i + 2];
        const largeArc = nums[i + 3];
        const sweep = nums[i + 4];
        const ex = isRel ? cx + nums[i + 5] : nums[i + 5];
        const ey = isRel ? cy + nums[i + 6] : nums[i + 6];
        segments.push({
          type: 'A', x1: cx, y1: cy,
          rx, ry, rotation, largeArc, sweep,
          x2: ex, y2: ey,
        });
        cx = ex; cy = ey;
      }
    } else if (CMD === 'Z') {
      if (Math.abs(cx - sx) > 0.001 || Math.abs(cy - sy) > 0.001) {
        segments.push({ type: 'L', x1: cx, y1: cy, x2: sx, y2: sy });
      }
      cx = sx; cy = sy;
    }
  }

  return segments;
}

/**
 * Sample all path segments into evenly-spaced points.
 */
function sampleSegments(segments, numSamples) {
  // First, densely sample all segments
  const dense = [];
  for (const seg of segments) {
    if (seg.type === 'M') {
      dense.push({ x: seg.x, y: seg.y });
    } else if (seg.type === 'L') {
      // Add endpoint (start already in dense from previous segment)
      dense.push({ x: seg.x2, y: seg.y2 });
    } else if (seg.type === 'C') {
      // Cubic Bézier — sample at 50 points per segment
      for (let i = 1; i <= 50; i++) {
        const t = i / 50;
        dense.push(cubicBezierAt(seg.x1, seg.y1, seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x2, seg.y2, t));
      }
    } else if (seg.type === 'Q') {
      for (let i = 1; i <= 50; i++) {
        const t = i / 50;
        dense.push(quadBezierAt(seg.x1, seg.y1, seg.cpx, seg.cpy, seg.x2, seg.y2, t));
      }
    } else if (seg.type === 'A') {
      // Approximate arc with many line segments
      const arcPts = approximateArc(seg, 50);
      for (let i = 1; i < arcPts.length; i++) {
        dense.push(arcPts[i]);
      }
    }
  }

  if (dense.length < 2) return dense;

  // Compute cumulative arc lengths
  const arcLens = [0];
  for (let i = 1; i < dense.length; i++) {
    const dx = dense[i].x - dense[i - 1].x;
    const dy = dense[i].y - dense[i - 1].y;
    arcLens.push(arcLens[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = arcLens[arcLens.length - 1];
  if (totalLen === 0) return [dense[0]];

  // Resample at uniform arc-length intervals
  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const targetLen = (i / (numSamples - 1)) * totalLen;
    // Binary search for segment
    let lo = 0, hi = arcLens.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (arcLens[mid] <= targetLen) lo = mid;
      else hi = mid;
    }
    const segFrac = (arcLens[hi] - arcLens[lo]) > 0
      ? (targetLen - arcLens[lo]) / (arcLens[hi] - arcLens[lo])
      : 0;
    result.push({
      x: dense[lo].x + (dense[hi].x - dense[lo].x) * segFrac,
      y: dense[lo].y + (dense[hi].y - dense[lo].y) * segFrac,
    });
  }

  return result;
}

function cubicBezierAt(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, t) {
  const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt;
  const t2 = t * t, t3 = t2 * t;
  return {
    x: mt3 * x1 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x2,
    y: mt3 * y1 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y2,
  };
}

function quadBezierAt(x1, y1, cpx, cpy, x2, y2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2,
  };
}

/**
 * Approximate an SVG arc segment as a polyline.
 * Uses endpoint-to-center parameterization.
 */
function approximateArc(seg, n) {
  const { x1, y1, rx: _rx, ry: _ry, rotation, largeArc, sweep, x2, y2 } = seg;
  let rx = Math.abs(_rx), ry = Math.abs(_ry);
  if (rx === 0 || ry === 0) {
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  }

  const phi = (rotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

  const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }

  const num = Math.max(0, rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p);
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let sq = den > 0 ? Math.sqrt(num / den) : 0;
  if (largeArc === sweep) sq = -sq;

  const cxp = sq * (rx * y1p) / ry;
  const cyp = sq * -(ry * x1p) / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
  let dtheta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1;

  if (sweep && dtheta < 0) dtheta += 2 * Math.PI;
  if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;

  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = theta1 + (i / n) * dtheta;
    const xr = rx * Math.cos(t), yr = ry * Math.sin(t);
    pts.push({
      x: cosPhi * xr - sinPhi * yr + cx,
      y: sinPhi * xr + cosPhi * yr + cy,
    });
  }
  return pts;
}
