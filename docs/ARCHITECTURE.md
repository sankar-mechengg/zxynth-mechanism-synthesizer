# Zxynth Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React + Vite + Zustand + Tailwind              │
│                     (Vercel / CDN)                           │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Landing │  │   Path   │  │ Function │  │  Motion  │    │
│  │  Page   │  │ Synthesis│  │ Synthesis│  │ Synthesis│    │
│  └─────────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│                     │             │              │           │
│  ┌──────────────────┴─────────────┴──────────────┘          │
│  │                Synthesis Page                             │
│  │  Input → Type → Number → Dimensional → Results           │
│  └──────────────────┬────────────────────────────┐          │
│                     │                            │          │
│  ┌──────────────────┘   ┌────────────────────────┘          │
│  │ Drawing Canvas       │ Mechanism Viewer                  │
│  │ (Freehand / Points)  │ (Animation + Overlays)            │
│  └──────────────────────┴───────────────────────────┘       │
│                     │  REST API (JSON)  ▲                    │
└─────────────────────┼──────────────────┼────────────────────┘
                      ▼                  │
┌─────────────────────┼──────────────────┼────────────────────┐
│                     │     BACKEND      │                    │
│              FastAPI + Celery + Redis                        │
│                    (Railway)                                 │
│                                                             │
│  ┌───────────────────────────────────────┐                  │
│  │             FastAPI Server             │                  │
│  │  /api/synthesize   (POST → queue job) │                  │
│  │  /api/job/{id}     (GET → poll status)│                  │
│  │  /api/export/*     (POST → generate)  │                  │
│  │  /api/parse/*      (POST → validate)  │                  │
│  └───────────────────┬───────────────────┘                  │
│                      │                                      │
│                      ▼                                      │
│  ┌───────────────────────────────────────┐                  │
│  │          Redis (State + Queue)         │                  │
│  │  job:{id}:status   → running/complete │                  │
│  │  job:{id}:progress → gen + fitness    │                  │
│  │  job:{id}:result   → JSON blob        │                  │
│  └───────────────────┬───────────────────┘                  │
│                      │                                      │
│                      ▼                                      │
│  ┌───────────────────────────────────────┐                  │
│  │          Celery Worker(s)             │                  │
│  │                                       │                  │
│  │  ┌─────────────────────────────────┐  │                  │
│  │  │      Synthesis Pipeline         │  │                  │
│  │  │  type → number → dimensional    │  │                  │
│  │  │                                 │  │                  │
│  │  │  ┌────────────┐ ┌───────────┐   │  │                  │
│  │  │  │ Analytical │ │Optimization│  │  │                  │
│  │  │  │Freudenstein│ │ DE/GA/PSO │   │  │                  │
│  │  │  │ Burmester  │ │   /SA     │   │  │                  │
│  │  │  └────────────┘ └───────────┘   │  │                  │
│  │  └─────────────────────────────────┘  │                  │
│  └───────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Frontend (`frontend/src/`)

| Module | Files | Responsibility |
|---|---|---|
| `pages/` | 5 | Route-level page components: Landing, PathSynthesis, FunctionSynthesis, MotionSynthesis, Results |
| `components/layout/` | 3 | Navbar, Footer, PageContainer with blueprint grid |
| `components/landing/` | 5 | Hero, ProblemOverview, QuickStart, ToolComparison |
| `components/common/` | 9 | Reusable UI: FileUploader, ParameterInput, SelectDropdown, StepIndicator, ProgressPanel, ExportMenu, Tooltip, ErrorBanner, ThemeToggle |
| `components/canvas/` | 7 | Drawing system: DrawingCanvas (orchestrator), FreehandTool (perfect-freehand), PointPlaceTool (Bézier), PointEditor (drag), GridOverlay, PathPreview, CanvasToolbar |
| `components/input/` | 7 | Problem-specific inputs: PathInputPanel, FunctionInputPanel, MotionInputPanel, MechanismTypeSelector, AlgorithmSelector, ConstraintPanel, TimingInputPanel |
| `components/synthesis/` | 7 | Workflow stepper: SynthesisPage, TypeSynthesisStep, NumberSynthesisStep, DimensionalSynthesisStep, AnalyticalSolution, OptimizationSolution, SynthesisComparison |
| `components/results/` | 6 | Results display: MechanismParams, ErrorMetrics, CognatesPanel, InversionPanel, PerformanceSummary, ResultsPage |
| `components/visualization/` | 8 | Mechanism viewer: MechanismViewer (orchestrator), AnimationControls, LinkRenderer, JointRenderer, CouplerCurveOverlay, DesiredPathOverlay, ErrorShading, GifExporter |
| `components/education/` | 7 | Theory sidebar: EducationSidebar, GrueblerExplainer, FreudensteinExplainer, GrashofExplainer, LoopClosureExplainer, OptimizationExplainer, TransmissionAngleExplainer |
| `stores/` | 6 | Zustand state: useAppStore, usePathStore, useFunctionStore, useMotionStore, useSynthesisStore, useVisualizationStore |
| `utils/` | 7 | Parsers and helpers: svgParser, csvParser, mathParser, bezierUtils, coordinateTransform, exportUtils, formatUtils |
| `hooks/` | 3 | useCanvasInteraction, useFileUpload, usePolling |

### Backend (`backend/app/`)

| Module | Files | Responsibility |
|---|---|---|
| `api/` | 4 | FastAPI routes: synthesis, export, parse, health |
| `core/` | 3 | Celery app config, job manager (Redis state), task definitions |
| `models/` | 3 | Pydantic schemas, mechanism dataclasses, enums |
| `synthesis/` | 3 | Pipeline orchestrator, type synthesis, number synthesis |
| `synthesis/analytical/` | 4 | Freudenstein, precision points, Burmester, Chebyshev spacing |
| `synthesis/optimization/` | 7 | Objective functions, constraints, bounds, DE, GA, PSO, SA |
| `synthesis/dimensional/` | 4 | four_bar, six_bar_watt, six_bar_stephenson, slider_crank |
| `kinematics/` | 8 | loop_closure, forward_kinematics, coupler_curve, grashof, transmission_angle, cognates, inversion, defect_check |
| `parsers/` | 2 | SVG parser (lxml), CSV parser |
| `utils/` | 3 | Geometry, curve utilities, error metrics |
| `export/` | 5 | PDF (ReportLab), GIF (matplotlib+Pillow), DXF (ezdxf), SVG (svgwrite), JSON/CSV |

## Data Flow

### Synthesis Job Lifecycle

```
1. User configures input (path/function/motion + mechanism type + algorithm)
2. Frontend store.buildRequest() → JSON payload
3. POST /api/synthesize → FastAPI validates → creates Redis job → dispatches Celery task
4. Celery worker picks up task → runs pipeline:
   a. Prepare input data (numpy array)
   b. Type synthesis (classify, recommend)
   c. Number synthesis (verify DOF)
   d. Dimensional synthesis:
      - Analytical: Freudenstein / precision points / Burmester
      - Optimization: DE/GA/PSO/SA with progress callbacks
      - Verification: coupler curve, error metrics, Grashof, transmission angle, defects
      - Cognates: Roberts-Chebyshev computation
5. Progress → Redis (generation count + best fitness)
6. Frontend polls GET /api/job/{id}/status every 2 seconds
7. On complete: frontend fetches GET /api/job/{id}/result
8. Results populate useSynthesisStore → MechanismViewer renders animation
```

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | React + Vite | Fast HMR, JSX, large ecosystem |
| State management | Zustand | Lightweight, no boilerplate, hooks-based |
| Styling | Tailwind CSS | Utility-first, dark/light mode, consistent design |
| Backend framework | FastAPI | Async, auto-docs, Pydantic validation |
| Task queue | Celery + Redis | Production-grade, separate worker processes |
| Optimization | SciPy (DE) + custom (GA/PSO/SA) | SciPy DE is battle-tested; custom implementations for educational transparency |
| PDF generation | ReportLab | Pure Python, no external dependencies |
| DXF export | ezdxf | Standards-compliant DXF, widely supported |
| SVG drawing | perfect-freehand (FE) + svgwrite (BE) | Smooth strokes + clean vector output |
| Math parsing | math.js | Robust expression evaluation, safe sandbox |

## Security Notes

- No authentication in V1 (stateless tool)
- CORS restricted to allowed origins
- File uploads limited to 5MB
- Job timeout: 120 seconds
- Redis keys auto-expire after 2 hours
- No user data stored persistently
