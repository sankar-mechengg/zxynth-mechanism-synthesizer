/**
 * Format Utilities
 * Number formatting, angle display, unit display, and other presentation helpers.
 */

/**
 * Format a number to a fixed number of decimal places, trimming trailing zeros.
 *
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatNum(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return parseFloat(value.toFixed(decimals)).toString();
}

/**
 * Format a number with fixed decimals (no trailing zero removal).
 *
 * @param {number} value
 * @param {number} [decimals=4]
 * @returns {string}
 */
export function formatFixed(value, decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(decimals);
}

/**
 * Format an angle in degrees with the ° symbol.
 *
 * @param {number} angleDeg
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatAngle(angleDeg, decimals = 1) {
  if (angleDeg === null || angleDeg === undefined || isNaN(angleDeg)) return '—';
  return `${parseFloat(angleDeg.toFixed(decimals))}°`;
}

/**
 * Format a length/distance value with optional unit.
 *
 * @param {number} value
 * @param {string} [unit='']
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatLength(value, unit = '', decimals = 2) {
  const num = formatNum(value, decimals);
  return unit ? `${num} ${unit}` : num;
}

/**
 * Format a percentage.
 *
 * @param {number} value - Value as fraction (0.05 = 5%) or as percentage (5)
 * @param {boolean} [isFraction=false] - If true, multiply by 100
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatPercent(value, isFraction = false, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const pct = isFraction ? value * 100 : value;
  return `${parseFloat(pct.toFixed(decimals))}%`;
}

/**
 * Format elapsed time in human-readable form.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

/**
 * Format a mechanism type enum to display label.
 *
 * @param {string} type - e.g., 'four_bar', 'six_bar_watt', etc.
 * @returns {string}
 */
export function formatMechanismType(type) {
  const labels = {
    four_bar: '4-Bar Linkage',
    six_bar_watt: '6-Bar Watt-I',
    six_bar_stephenson: '6-Bar Stephenson-III',
    slider_crank: 'Slider-Crank',
  };
  return labels[type] || type;
}

/**
 * Format Grashof classification.
 *
 * @param {string} type
 * @returns {string}
 */
export function formatGrashofType(type) {
  const labels = {
    'crank-rocker': 'Crank-Rocker',
    'double-crank': 'Double-Crank (Drag Link)',
    'double-rocker': 'Double-Rocker',
    'change-point': 'Change-Point',
    'non-grashof': 'Non-Grashof',
  };
  return labels[type] || type;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert degrees to radians.
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}
