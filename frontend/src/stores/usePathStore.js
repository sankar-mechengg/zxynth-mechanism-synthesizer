import { create } from 'zustand';
import { DEFAULTS } from '../config/api';

/**
 * Path Generation State Store
 *
 * Manages all state for the path generation workflow:
 * - Input path data (from upload, freehand, or point placement)
 * - Control points (for Bézier editing)
 * - Timing configuration (prescribed or free)
 * - Mechanism type and constraint selections
 * - Algorithm configuration
 */
const usePathStore = create((set, get) => ({
  // ── Input Path Data ──────────────────────────────────────────
  /** Sampled path points in mechanism coords: [{x, y}] */
  points: [],
  /** Bézier control points (from point-place tool): [{x, y}] */
  controlPoints: [],
  /** Source of current path: 'upload_svg' | 'upload_csv' | 'freehand' | 'point_place' | null */
  inputSource: null,
  /** Original filename if uploaded */
  fileName: null,
  /** Metadata from file parsing */
  fileMetadata: null,

  // ── Timing ───────────────────────────────────────────────────
  /** Whether prescribed timing is enabled */
  prescribedTiming: false,
  /** Timing map: [{pointIndex, crankAngle}] — only used if prescribedTiming=true */
  timingMap: [],
  /** Input crank angle range: [startDeg, endDeg] */
  crankRange: [0, 360],

  // ── Mechanism Config ─────────────────────────────────────────
  /** Selected mechanism type: 'four_bar' | 'six_bar_watt' | 'six_bar_stephenson' | 'slider_crank' */
  mechanismType: 'four_bar',

  // ── Algorithm Config ─────────────────────────────────────────
  /** Selected algorithm: 'de' | 'ga' | 'pso' | 'sa' */
  algorithm: 'de',
  /** Algorithm hyperparameters */
  hyperparams: {
    populationSize: DEFAULTS.populationSize,
    maxGenerations: DEFAULTS.maxGenerations,
    numSeeds: DEFAULTS.numSeeds,
  },

  // ── Constraints ──────────────────────────────────────────────
  /** Error tolerance in % */
  tolerance: DEFAULTS.tolerance,
  /** Minimum transmission angle in degrees */
  minTransmissionAngle: DEFAULTS.minTransmissionAngle,
  /** Whether Grashof condition is required */
  grashofRequired: DEFAULTS.grashofRequired,
  /** Fixed ground pivot locations (null = free) */
  groundPivot1: null,
  groundPivot2: null,

  // ── Actions ──────────────────────────────────────────────────

  /** Set path points (from any source) */
  setPoints: (points) => set({ points }),

  /** Set control points (Bézier editing) */
  setControlPoints: (controlPoints) => set({ controlPoints }),

  /** Set path from file upload */
  setFromUpload: (points, source, fileName, metadata) =>
    set({
      points,
      controlPoints: [],
      inputSource: source,
      fileName,
      fileMetadata: metadata,
    }),

  /** Set path from freehand drawing */
  setFromFreehand: (points) =>
    set({
      points,
      controlPoints: [],
      inputSource: 'freehand',
      fileName: null,
      fileMetadata: null,
    }),

  /** Set path from point placement (also updates sampled points) */
  setFromPointPlace: (controlPoints, sampledPoints) =>
    set({
      controlPoints,
      points: sampledPoints,
      inputSource: 'point_place',
      fileName: null,
      fileMetadata: null,
    }),

  /** Toggle prescribed timing */
  setPrescribedTiming: (enabled) => set({ prescribedTiming: enabled }),

  /** Update timing map */
  setTimingMap: (timingMap) => set({ timingMap }),

  /** Set crank angle range */
  setCrankRange: (range) => set({ crankRange: range }),

  /** Set mechanism type */
  setMechanismType: (type) => set({ mechanismType: type }),

  /** Set optimization algorithm */
  setAlgorithm: (algorithm) => set({ algorithm }),

  /** Update hyperparameters (partial) */
  setHyperparams: (partial) =>
    set((s) => ({ hyperparams: { ...s.hyperparams, ...partial } })),

  /** Set tolerance */
  setTolerance: (tolerance) => set({ tolerance }),

  /** Set min transmission angle */
  setMinTransmissionAngle: (angle) => set({ minTransmissionAngle: angle }),

  /** Set Grashof requirement */
  setGrashofRequired: (required) => set({ grashofRequired: required }),

  /** Set ground pivot constraints */
  setGroundPivot1: (pivot) => set({ groundPivot1: pivot }),
  setGroundPivot2: (pivot) => set({ groundPivot2: pivot }),

  /** Build the synthesis request payload for the backend */
  buildRequest: () => {
    const s = get();
    return {
      problemType: 'path',
      mechanismType: s.mechanismType,
      algorithm: s.algorithm,
      hyperparams: s.hyperparams,
      desiredPath: s.points.map((p) => [p.x, p.y]),
      prescribedTiming: s.prescribedTiming,
      timingMap: s.prescribedTiming ? s.timingMap : null,
      crankRange: s.crankRange,
      constraints: {
        tolerance: s.tolerance,
        minTransmissionAngle: s.minTransmissionAngle,
        grashofRequired: s.grashofRequired,
        groundPivot1: s.groundPivot1,
        groundPivot2: s.groundPivot2,
      },
    };
  },

  /** Reset all path state */
  reset: () =>
    set({
      points: [],
      controlPoints: [],
      inputSource: null,
      fileName: null,
      fileMetadata: null,
      prescribedTiming: false,
      timingMap: [],
      crankRange: [0, 360],
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
      groundPivot1: null,
      groundPivot2: null,
    }),
}));

export default usePathStore;
