import { create } from 'zustand';
import { DEFAULTS } from '../config/api';

/**
 * Function Generation State Store
 *
 * Manages all state for function generation:
 * - Mathematical expression (y = f(x))
 * - CSV-uploaded θ_in/θ_out pairs
 * - Manually entered discrete pairs
 * - Input/output angle ranges
 * - Mechanism and algorithm selection
 */
const useFunctionStore = create((set, get) => ({
  // ── Input Mode ───────────────────────────────────────────────
  /** Input mode: 'expression' | 'csv' | 'discrete' */
  inputMode: 'expression',

  // ── Expression Mode ──────────────────────────────────────────
  /** Math expression string, e.g., "180 * sin(pi * x)" */
  expression: '',
  /** Whether expression is valid */
  expressionValid: false,
  /** Expression validation error */
  expressionError: null,

  // ── Sampled Pairs (from expression or CSV) ───────────────────
  /** Sampled function pairs: [{thetaIn, thetaOut}] */
  sampledPairs: [],

  // ── Discrete Pairs (manual entry) ────────────────────────────
  /** Manually entered precision pairs: [{thetaIn, thetaOut}] */
  discretePairs: [
    { thetaIn: 0, thetaOut: 0 },
    { thetaIn: 60, thetaOut: 30 },
    { thetaIn: 120, thetaOut: 90 },
  ],

  // ── Input/Output Ranges ──────────────────────────────────────
  /** Input angle range in degrees */
  thetaInRange: [0, 180],
  /** Output angle range (auto-computed or manual) */
  thetaOutRange: [0, 180],

  // ── CSV Upload ───────────────────────────────────────────────
  /** CSV file name */
  csvFileName: null,
  /** CSV parse warnings */
  csvWarnings: [],
  /** Whether CSV data's θ_in is monotonic */
  csvIsMonotonic: true,

  // ── Mechanism Config ─────────────────────────────────────────
  mechanismType: 'four_bar',
  algorithm: 'de',
  hyperparams: {
    populationSize: DEFAULTS.populationSize,
    maxGenerations: DEFAULTS.maxGenerations,
    numSeeds: DEFAULTS.numSeeds,
  },

  // ── Constraints ──────────────────────────────────────────────
  tolerance: DEFAULTS.tolerance,
  minTransmissionAngle: DEFAULTS.minTransmissionAngle,
  grashofRequired: DEFAULTS.grashofRequired,

  // ── Actions ──────────────────────────────────────────────────

  setInputMode: (mode) => set({ inputMode: mode }),

  /** Set and validate expression */
  setExpression: (expr) => {
    // Validation happens in the component via mathParser
    set({ expression: expr });
  },

  setExpressionValid: (valid, error = null) =>
    set({ expressionValid: valid, expressionError: error }),

  /** Set sampled pairs (from expression evaluation or CSV parse) */
  setSampledPairs: (pairs) => set({ sampledPairs: pairs }),

  /** Set from CSV upload */
  setFromCsv: (pairs, fileName, warnings, isMonotonic) =>
    set({
      inputMode: 'csv',
      sampledPairs: pairs,
      csvFileName: fileName,
      csvWarnings: warnings,
      csvIsMonotonic: isMonotonic,
    }),

  // ── Discrete Pairs Actions ───────────────────────────────────

  setDiscretePairs: (pairs) => set({ discretePairs: pairs }),

  addDiscretePair: () =>
    set((s) => ({
      discretePairs: [
        ...s.discretePairs,
        { thetaIn: 0, thetaOut: 0 },
      ],
    })),

  updateDiscretePair: (index, field, value) =>
    set((s) => {
      const updated = [...s.discretePairs];
      updated[index] = { ...updated[index], [field]: value };
      return { discretePairs: updated };
    }),

  removeDiscretePair: (index) =>
    set((s) => ({
      discretePairs: s.discretePairs.filter((_, i) => i !== index),
    })),

  // ── Range and Config ─────────────────────────────────────────

  setThetaInRange: (range) => set({ thetaInRange: range }),
  setThetaOutRange: (range) => set({ thetaOutRange: range }),
  setMechanismType: (type) => set({ mechanismType: type }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setHyperparams: (partial) =>
    set((s) => ({ hyperparams: { ...s.hyperparams, ...partial } })),
  setTolerance: (tolerance) => set({ tolerance }),
  setMinTransmissionAngle: (angle) => set({ minTransmissionAngle: angle }),
  setGrashofRequired: (required) => set({ grashofRequired: required }),

  /** Build synthesis request payload */
  buildRequest: () => {
    const s = get();
    let functionData;

    if (s.inputMode === 'expression') {
      functionData = {
        type: 'expression',
        expression: s.expression,
        thetaInRange: s.thetaInRange,
        pairs: s.sampledPairs.map((p) => [p.thetaIn, p.thetaOut]),
      };
    } else if (s.inputMode === 'csv') {
      functionData = {
        type: 'csv',
        pairs: s.sampledPairs.map((p) => [p.thetaIn, p.thetaOut]),
      };
    } else {
      functionData = {
        type: 'discrete',
        pairs: s.discretePairs.map((p) => [p.thetaIn, p.thetaOut]),
      };
    }

    return {
      problemType: 'function',
      mechanismType: s.mechanismType,
      algorithm: s.algorithm,
      hyperparams: s.hyperparams,
      functionData,
      constraints: {
        tolerance: s.tolerance,
        minTransmissionAngle: s.minTransmissionAngle,
        grashofRequired: s.grashofRequired,
      },
    };
  },

  /** Reset all function state */
  reset: () =>
    set({
      inputMode: 'expression',
      expression: '',
      expressionValid: false,
      expressionError: null,
      sampledPairs: [],
      discretePairs: [
        { thetaIn: 0, thetaOut: 0 },
        { thetaIn: 60, thetaOut: 30 },
        { thetaIn: 120, thetaOut: 90 },
      ],
      thetaInRange: [0, 180],
      thetaOutRange: [0, 180],
      csvFileName: null,
      csvWarnings: [],
      csvIsMonotonic: true,
      mechanismType: 'four_bar',
      algorithm: 'de',
      hyperparams: {
        populationSize: DEFAULTS.populationSize,
        maxGenerations: DEFAULTS.maxGenerations,
        numSeeds: DEFAULTS.numSeeds,
      },
      tolerance: DEFAULTS.tolerance,
      minTransmissionAngle: DEFAULTS.minTransmissionAngle,
      grashofRequired: DEFAULTS.grashofRequired,
    }),
}));

export default useFunctionStore;
