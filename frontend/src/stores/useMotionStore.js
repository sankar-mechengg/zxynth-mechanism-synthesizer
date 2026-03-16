import { create } from 'zustand';
import { DEFAULTS } from '../config/api';

/**
 * Motion Generation State Store
 *
 * Manages all state for motion generation (rigid-body guidance):
 * - Precision poses: positions + orientations (x, y, θ)
 * - Interactive canvas placement state
 * - Coupler body shape for visualization
 * - Mechanism and constraint configuration
 */
const useMotionStore = create((set, get) => ({
  // ── Precision Poses ──────────────────────────────────────────
  /** Array of precision poses: [{x, y, theta}] where theta is degrees */
  poses: [
    { x: 0, y: 0, theta: 0 },
    { x: 30, y: 40, theta: 25 },
    { x: 60, y: 60, theta: 50 },
  ],

  // ── Input Mode ───────────────────────────────────────────────
  /** Input mode: 'table' | 'canvas' */
  inputMode: 'table',

  // ── Canvas Interaction ───────────────────────────────────────
  /** Index of pose currently being placed/edited on canvas (-1 = none) */
  activePoseIndex: -1,
  /** Whether user is in "place new pose" mode on canvas */
  placingNewPose: false,

  // ── Coupler Shape (for visualization) ────────────────────────
  /** Coupler body shape for rendering: [{x, y}] relative to coupler reference point */
  couplerShape: [
    { x: -15, y: -8 },
    { x: 25, y: -8 },
    { x: 25, y: 8 },
    { x: -15, y: 8 },
  ],

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
  groundPivot1: null,
  groundPivot2: null,

  // ── Actions ──────────────────────────────────────────────────

  /** Set all poses */
  setPoses: (poses) => set({ poses }),

  /** Add a new pose */
  addPose: (pose = null) =>
    set((s) => {
      const last = s.poses[s.poses.length - 1] || { x: 0, y: 0, theta: 0 };
      const newPose = pose || {
        x: last.x + 20,
        y: last.y + 15,
        theta: last.theta + 15,
      };
      return { poses: [...s.poses, newPose] };
    }),

  /** Update a specific pose */
  updatePose: (index, updates) =>
    set((s) => {
      const updated = [...s.poses];
      updated[index] = { ...updated[index], ...updates };
      return { poses: updated };
    }),

  /** Remove a pose by index */
  removePose: (index) =>
    set((s) => ({
      poses: s.poses.filter((_, i) => i !== index),
      activePoseIndex: s.activePoseIndex === index ? -1 : s.activePoseIndex,
    })),

  /** Reorder poses (drag-and-drop) */
  reorderPoses: (fromIndex, toIndex) =>
    set((s) => {
      const updated = [...s.poses];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { poses: updated };
    }),

  // ── Input Mode ───────────────────────────────────────────────

  setInputMode: (mode) => set({ inputMode: mode }),
  setActivePoseIndex: (index) => set({ activePoseIndex: index }),
  setPlacingNewPose: (placing) => set({ placingNewPose: placing }),

  // ── Coupler Shape ────────────────────────────────────────────

  setCouplerShape: (shape) => set({ couplerShape: shape }),

  // ── Mechanism Config ─────────────────────────────────────────

  setMechanismType: (type) => set({ mechanismType: type }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setHyperparams: (partial) =>
    set((s) => ({ hyperparams: { ...s.hyperparams, ...partial } })),
  setTolerance: (tolerance) => set({ tolerance }),
  setMinTransmissionAngle: (angle) => set({ minTransmissionAngle: angle }),
  setGrashofRequired: (required) => set({ grashofRequired: required }),
  setGroundPivot1: (pivot) => set({ groundPivot1: pivot }),
  setGroundPivot2: (pivot) => set({ groundPivot2: pivot }),

  /** Build synthesis request payload */
  buildRequest: () => {
    const s = get();
    return {
      problemType: 'motion',
      mechanismType: s.mechanismType,
      algorithm: s.algorithm,
      hyperparams: s.hyperparams,
      poses: s.poses.map((p) => [p.x, p.y, p.theta]),
      constraints: {
        tolerance: s.tolerance,
        minTransmissionAngle: s.minTransmissionAngle,
        grashofRequired: s.grashofRequired,
        groundPivot1: s.groundPivot1,
        groundPivot2: s.groundPivot2,
      },
    };
  },

  /** Reset all motion state */
  reset: () =>
    set({
      poses: [
        { x: 0, y: 0, theta: 0 },
        { x: 30, y: 40, theta: 25 },
        { x: 60, y: 60, theta: 50 },
      ],
      inputMode: 'table',
      activePoseIndex: -1,
      placingNewPose: false,
      couplerShape: [
        { x: -15, y: -8 },
        { x: 25, y: -8 },
        { x: 25, y: 8 },
        { x: -15, y: 8 },
      ],
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

export default useMotionStore;
