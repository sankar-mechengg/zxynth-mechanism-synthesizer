/**
 * CSV Parser
 * Handles two CSV formats:
 * 1. Path data: x,y (two columns of coordinates)
 * 2. Function data: theta_in, theta_out (two columns of angle pairs)
 *
 * Supports BOM, varying delimiters (comma, semicolon, tab), optional headers.
 */

/**
 * Parse CSV content into point array.
 *
 * @param {string} content - Raw CSV file content
 * @param {'path' | 'function'} [mode='path'] - Parsing mode
 * @returns {{ points: Array<{x: number, y: number}>, hasHeader: boolean, rowCount: number }}
 */
export function parseCsv(content, mode = 'path') {
  // Remove BOM
  let cleaned = content.replace(/^\uFEFF/, '').trim();

  if (!cleaned) throw new Error('CSV file is empty');

  // Detect delimiter
  const delimiter = detectDelimiter(cleaned);

  // Split into lines
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV must have at least 2 data rows');

  // Detect header
  const firstLine = lines[0].split(delimiter).map((s) => s.trim());
  const hasHeader = firstLine.some((cell) => isNaN(parseFloat(cell)));
  const dataStart = hasHeader ? 1 : 0;

  // Parse data rows
  const points = [];
  const errors = [];

  for (let i = dataStart; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((s) => s.trim());
    if (cells.length < 2) {
      errors.push(`Row ${i + 1}: expected at least 2 columns, got ${cells.length}`);
      continue;
    }

    const v1 = parseFloat(cells[0]);
    const v2 = parseFloat(cells[1]);

    if (isNaN(v1) || isNaN(v2)) {
      errors.push(`Row ${i + 1}: non-numeric values "${cells[0]}", "${cells[1]}"`);
      continue;
    }

    if (!isFinite(v1) || !isFinite(v2)) {
      errors.push(`Row ${i + 1}: infinite values`);
      continue;
    }

    points.push({ x: v1, y: v2 });
  }

  if (points.length < 2) {
    throw new Error(
      `Only ${points.length} valid data rows found. Need at least 2.${
        errors.length > 0 ? '\nFirst error: ' + errors[0] : ''
      }`
    );
  }

  // Validate: check for reasonable data range
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);

  if (xRange === 0 && yRange === 0) {
    throw new Error('All points are identical — no path to trace');
  }

  return {
    points,
    hasHeader,
    rowCount: points.length,
    warnings: errors.length > 0 ? errors.slice(0, 5) : [],
  };
}

/**
 * Parse CSV specifically for function generation (theta_in, theta_out).
 * Returns normalized data with angles in degrees.
 *
 * @param {string} content - Raw CSV content
 * @returns {{ pairs: Array<{thetaIn: number, thetaOut: number}>, hasHeader: boolean }}
 */
export function parseFunctionCsv(content) {
  const { points, hasHeader, rowCount, warnings } = parseCsv(content, 'function');

  // Convert to named theta pairs
  const pairs = points.map((p) => ({
    thetaIn: p.x,
    thetaOut: p.y,
  }));

  // Validate: theta_in should be monotonically increasing
  let isMonotonic = true;
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i].thetaIn <= pairs[i - 1].thetaIn) {
      isMonotonic = false;
      break;
    }
  }

  return {
    pairs,
    hasHeader,
    rowCount,
    isMonotonic,
    warnings: [
      ...warnings,
      ...(!isMonotonic ? ['Warning: θ_input values are not monotonically increasing'] : []),
    ],
  };
}

/**
 * Detect CSV delimiter from content.
 */
function detectDelimiter(content) {
  const firstLine = content.split(/\r?\n/)[0];
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
  };

  if (counts['\t'] > 0 && counts['\t'] >= counts[',']) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

/**
 * Generate CSV string from points array.
 *
 * @param {Array<{x: number, y: number}>} points
 * @param {string} [header='x,y']
 * @returns {string}
 */
export function pointsToCsv(points, header = 'x,y') {
  const lines = [header];
  for (const p of points) {
    lines.push(`${p.x},${p.y}`);
  }
  return lines.join('\n');
}
