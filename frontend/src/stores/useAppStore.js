import { create } from 'zustand';

/**
 * Global application state store.
 * Manages theme (dark/light), sidebar visibility, and active navigation context.
 */
const useAppStore = create((set, get) => ({
  // Theme: 'dark' | 'light'
  theme: 'dark',

  // Education sidebar
  sidebarOpen: false,

  // Currently active problem type: 'path' | 'function' | 'motion' | null
  activeProblemType: null,

  // Current step in synthesis workflow: 0=input, 1=type, 2=number, 3=dimensional, 4=results
  currentStep: 0,

  /**
   * Initialize theme from localStorage or default to dark.
   */
  initTheme: () => {
    const stored = localStorage.getItem('zxynth-theme');
    if (stored === 'light' || stored === 'dark') {
      set({ theme: stored });
    } else {
      set({ theme: 'dark' });
    }
  },

  /**
   * Toggle between dark and light mode.
   */
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('zxynth-theme', next);
    set({ theme: next });
  },

  /**
   * Set theme explicitly.
   */
  setTheme: (theme) => {
    localStorage.setItem('zxynth-theme', theme);
    set({ theme });
  },

  /**
   * Toggle education sidebar.
   */
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  /**
   * Set the active problem type when user navigates to a synthesis page.
   */
  setActiveProblemType: (type) => set({ activeProblemType: type }),

  /**
   * Set the current step in the synthesis workflow.
   */
  setCurrentStep: (step) => set({ currentStep: step }),

  /**
   * Reset the workflow to initial state.
   */
  resetWorkflow: () => set({ currentStep: 0, sidebarOpen: false }),
}));

export default useAppStore;
