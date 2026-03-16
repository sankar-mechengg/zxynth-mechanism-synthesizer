/**
 * API Configuration
 * Base URL, endpoint paths, polling intervals, and app-wide constants.
 */

// Backend base URL — proxied in dev via Vite, direct in production
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const API = {
  base: API_BASE,

  // Synthesis endpoints
  synthesize: `${API_BASE}/synthesize`,
  jobStatus: (jobId) => `${API_BASE}/job/${jobId}/status`,
  jobResult: (jobId) => `${API_BASE}/job/${jobId}/result`,

  // Parsing endpoints
  parseSvg: `${API_BASE}/parse/svg`,
  parseCsv: `${API_BASE}/parse/csv`,

  // Export endpoints
  exportPdf: `${API_BASE}/export/pdf`,
  exportGif: `${API_BASE}/export/gif`,
  exportDxf: `${API_BASE}/export/dxf`,
  exportSvg: `${API_BASE}/export/svg`,
  exportJson: `${API_BASE}/export/json`,
  exportCsv: `${API_BASE}/export/csv`,

  // Health
  health: `${API_BASE}/health`,
  queueStatus: `${API_BASE}/queue/status`,
};

// Polling configuration
export const POLLING = {
  interval: 2000,     // Poll every 2 seconds
  maxAttempts: 300,    // Max 10 minutes (300 × 2s)
  retryDelay: 5000,    // Retry after 5s on error
};

// Mechanism types
export const MECHANISM_TYPES = [
  { id: 'four_bar', label: '4-Bar Linkage', links: 4, joints: 4 },
  { id: 'six_bar_watt', label: '6-Bar Watt-I', links: 6, joints: 7 },
  { id: 'six_bar_stephenson', label: '6-Bar Stephenson-III', links: 6, joints: 7 },
  { id: 'slider_crank', label: 'Slider-Crank', links: 4, joints: '3R+1P' },
];

// Optimization algorithms
export const ALGORITHMS = [
  { id: 'de', label: 'Differential Evolution', description: 'Global optimizer + Nelder-Mead refinement' },
  { id: 'ga', label: 'Genetic Algorithm', description: 'Population-based evolutionary search' },
  { id: 'pso', label: 'Particle Swarm Optimization', description: 'Swarm intelligence optimizer' },
  { id: 'sa', label: 'Simulated Annealing', description: 'Probabilistic single-solution search' },
];

// Problem types
export const PROBLEM_TYPES = [
  { id: 'path', label: 'Path Generation', route: '/path' },
  { id: 'function', label: 'Function Generation', route: '/function' },
  { id: 'motion', label: 'Motion Generation', route: '/motion' },
];

// Default synthesis parameters
export const DEFAULTS = {
  tolerance: 5.0,               // Error tolerance in %
  minTransmissionAngle: 40.0,   // Degrees
  grashofRequired: true,
  populationSize: 100,
  maxGenerations: 400,
  numSeeds: 6,
  numPrecisionPoints: 101,      // Number of points to sample on desired curve
};

// Mechanism color palette (matches Tailwind config)
export const COLORS = {
  link: '#60a5fa',
  joint: '#f59e0b',
  coupler: '#34d399',
  desired: '#f472b6',
  error: '#ef4444',
  ground: '#94a3b8',
};
