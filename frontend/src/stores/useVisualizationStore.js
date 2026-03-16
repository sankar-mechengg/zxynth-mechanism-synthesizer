import { create } from 'zustand';

/**
 * Visualization & Animation State Store
 *
 * Controls mechanism animation playback and display options:
 * - Play/pause, speed, current frame/angle
 * - Display toggles (links, joints, coupler curve, desired path, error shading)
 * - GIF export settings
 */
const useVisualizationStore = create((set, get) => ({
  // ── Animation Playback ───────────────────────────────────────
  /** Whether animation is currently playing */
  isPlaying: false,
  /** Playback speed multiplier (0.25x to 4x) */
  speed: 1,
  /** Current crank angle in degrees (0–360) */
  currentAngle: 0,
  /** Animation frame ID (for cancelAnimationFrame) */
  _animFrameId: null,
  /** Last timestamp for frame delta calculation */
  _lastTimestamp: null,

  // ── Angle Range ──────────────────────────────────────────────
  /** Start angle for animation/export in degrees */
  startAngle: 0,
  /** End angle for animation/export in degrees */
  endAngle: 360,
  /** Angular step for discrete scrubbing */
  angleStep: 1,

  // ── Display Toggles ──────────────────────────────────────────
  /** Show mechanism links */
  showLinks: true,
  /** Show joint markers */
  showJoints: true,
  /** Show link/joint labels (L1, J1, etc.) */
  showLabels: true,
  /** Show coupler curve trace */
  showCouplerCurve: true,
  /** Show desired path overlay */
  showDesiredPath: true,
  /** Show error shading between desired and actual */
  showErrorShading: true,
  /** Show ground link hatching */
  showGround: true,

  // ── GIF Export Settings ──────────────────────────────────────
  gifSettings: {
    width: 800,
    height: 600,
    fps: 30,
    startAngle: 0,
    endAngle: 360,
    quality: 10, // gif.js quality (1=best, 20=fastest)
  },

  // ── Actions ──────────────────────────────────────────────────

  /** Start animation playback */
  play: () => {
    const s = get();
    if (s.isPlaying) return;

    set({ isPlaying: true, _lastTimestamp: null });

    const animate = (timestamp) => {
      const state = get();
      if (!state.isPlaying) return;

      if (state._lastTimestamp !== null) {
        const dt = (timestamp - state._lastTimestamp) / 1000; // seconds
        const degreesPerSecond = 60 * state.speed; // 60°/s at 1x = 6 seconds per revolution
        let nextAngle = state.currentAngle + degreesPerSecond * dt;

        // Wrap around
        if (nextAngle >= state.endAngle) {
          nextAngle = state.startAngle;
        }

        set({ currentAngle: nextAngle, _lastTimestamp: timestamp });
      } else {
        set({ _lastTimestamp: timestamp });
      }

      const frameId = requestAnimationFrame(animate);
      set({ _animFrameId: frameId });
    };

    const frameId = requestAnimationFrame(animate);
    set({ _animFrameId: frameId });
  },

  /** Pause animation */
  pause: () => {
    const s = get();
    if (s._animFrameId) {
      cancelAnimationFrame(s._animFrameId);
    }
    set({ isPlaying: false, _animFrameId: null, _lastTimestamp: null });
  },

  /** Toggle play/pause */
  togglePlay: () => {
    const s = get();
    if (s.isPlaying) {
      s.pause();
    } else {
      s.play();
    }
  },

  /** Reset animation to start */
  resetAnimation: () => {
    const s = get();
    if (s._animFrameId) cancelAnimationFrame(s._animFrameId);
    set({
      isPlaying: false,
      currentAngle: get().startAngle,
      _animFrameId: null,
      _lastTimestamp: null,
    });
  },

  /** Set current angle directly (scrubber) */
  setCurrentAngle: (angle) => set({ currentAngle: angle }),

  /** Set playback speed */
  setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(4, speed)) }),

  /** Set animation angle range */
  setAngleRange: (start, end) => set({ startAngle: start, endAngle: end }),

  /** Set angle step */
  setAngleStep: (step) => set({ angleStep: step }),

  // ── Display Toggle Actions ───────────────────────────────────

  toggleLinks: () => set((s) => ({ showLinks: !s.showLinks })),
  toggleJoints: () => set((s) => ({ showJoints: !s.showJoints })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleCouplerCurve: () => set((s) => ({ showCouplerCurve: !s.showCouplerCurve })),
  toggleDesiredPath: () => set((s) => ({ showDesiredPath: !s.showDesiredPath })),
  toggleErrorShading: () => set((s) => ({ showErrorShading: !s.showErrorShading })),
  toggleGround: () => set((s) => ({ showGround: !s.showGround })),

  /** Set a specific display toggle */
  setDisplayOption: (key, value) => set({ [key]: value }),

  // ── GIF Settings ─────────────────────────────────────────────

  setGifSettings: (partial) =>
    set((s) => ({
      gifSettings: { ...s.gifSettings, ...partial },
    })),

  // ── Reset ────────────────────────────────────────────────────

  reset: () => {
    const s = get();
    if (s._animFrameId) cancelAnimationFrame(s._animFrameId);
    set({
      isPlaying: false,
      speed: 1,
      currentAngle: 0,
      _animFrameId: null,
      _lastTimestamp: null,
      startAngle: 0,
      endAngle: 360,
      angleStep: 1,
      showLinks: true,
      showJoints: true,
      showLabels: true,
      showCouplerCurve: true,
      showDesiredPath: true,
      showErrorShading: true,
      showGround: true,
      gifSettings: {
        width: 800,
        height: 600,
        fps: 30,
        startAngle: 0,
        endAngle: 360,
        quality: 10,
      },
    });
  },
}));

export default useVisualizationStore;
