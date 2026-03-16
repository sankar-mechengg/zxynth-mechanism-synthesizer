/**
 * Math Expression Parser
 * Wraps math.js to evaluate user-provided function expressions.
 *
 * Conventions:
 * - `x` = normalized input (0 to 1)
 * - `theta` = actual input angle in degrees
 * - Output is the θ_output value in degrees
 */
import { evaluate, parse as mathParse } from 'mathjs';

/**
 * Validate a math expression string.
 *
 * @param {string} expr - Expression like "180 * sin(pi * x)" or "log(theta + 1) * 50"
 * @returns {{ valid: boolean, error: string|null, variables: string[] }}
 */
export function validateExpression(expr) {
  if (!expr || !expr.trim()) {
    return { valid: false, error: 'Expression is empty', variables: [] };
  }

  try {
    const node = mathParse(expr);

    // Extract variable names
    const variables = new Set();
    node.traverse((n) => {
      if (n.isSymbolNode && !isMathConstant(n.name)) {
        variables.add(n.name);
      }
    });

    const vars = [...variables];

    // Check that only allowed variables are used
    const allowed = new Set(['x', 'theta', 'pi', 'e', 'PI', 'E']);
    const unknown = vars.filter((v) => !allowed.has(v));
    if (unknown.length > 0) {
      return {
        valid: false,
        error: `Unknown variable(s): ${unknown.join(', ')}. Use 'x' (normalized 0–1) or 'theta' (degrees).`,
        variables: vars,
      };
    }

    // Test evaluate at a sample point
    evaluate(expr, { x: 0.5, theta: 90, pi: Math.PI, e: Math.E, PI: Math.PI, E: Math.E });

    return { valid: true, error: null, variables: vars };
  } catch (err) {
    return { valid: false, error: `Parse error: ${err.message}`, variables: [] };
  }
}

/**
 * Evaluate expression over a range of input values.
 *
 * @param {string} expr - Math expression
 * @param {number} thetaStart - Start angle in degrees
 * @param {number} thetaEnd - End angle in degrees
 * @param {number} [numPoints=101] - Number of sample points
 * @returns {Array<{thetaIn: number, thetaOut: number, x: number}>}
 */
export function evaluateExpression(expr, thetaStart, thetaEnd, numPoints = 101) {
  const validation = validateExpression(expr);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const results = [];
  const range = thetaEnd - thetaStart;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const theta = thetaStart + t * range;
    const x = t; // Normalized 0–1

    try {
      const scope = { x, theta, pi: Math.PI, e: Math.E, PI: Math.PI, E: Math.E };
      const thetaOut = evaluate(expr, scope);

      if (typeof thetaOut !== 'number' || !isFinite(thetaOut)) {
        throw new Error(`Non-numeric result at theta=${theta.toFixed(1)}`);
      }

      results.push({ thetaIn: theta, thetaOut, x });
    } catch (err) {
      throw new Error(`Evaluation failed at theta=${theta.toFixed(1)}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Check if a symbol name is a built-in math constant/function.
 */
function isMathConstant(name) {
  const builtins = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh',
    'sqrt', 'cbrt', 'abs', 'ceil', 'floor', 'round',
    'log', 'log2', 'log10', 'exp', 'pow',
    'min', 'max', 'sign',
    'pi', 'e', 'PI', 'E', 'i', 'Infinity', 'NaN',
  ]);
  return builtins.has(name);
}

/**
 * Get a human-readable description of what the expression computes.
 *
 * @param {string} expr
 * @returns {string}
 */
export function describeExpression(expr) {
  const { variables } = validateExpression(expr);
  const usesX = variables.includes('x');
  const usesTheta = variables.includes('theta');

  if (usesX && usesTheta) return `θ_out = f(x, θ) where x ∈ [0,1] and θ in degrees`;
  if (usesTheta) return `θ_out = f(θ) where θ is the input angle in degrees`;
  if (usesX) return `θ_out = f(x) where x ∈ [0,1] is normalized input`;
  return `θ_out = constant`;
}
