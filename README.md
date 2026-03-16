# Zxynth — Planar Mechanism Synthesis Web Application

**Zxynth** is a web-based tool for synthesizing, analyzing, and visualizing planar mechanisms. It supports path generation, function generation, and motion generation for 4-bar, 6-bar (Watt-I & Stephenson-III), and slider-crank mechanisms.

## Features

- **Path Generation** — Upload SVG/CSV or draw freehand paths; synthesize mechanisms that trace the desired curve
- **Function Generation** — Define input-output relationships via math expressions, CSV, or discrete pairs
- **Motion Generation** — Specify coupler positions and orientations for rigid-body guidance
- **4 Optimization Algorithms** — Differential Evolution, Genetic Algorithm, Particle Swarm Optimization, Simulated Annealing
- **Analytical + Optimization** — Precision-point analytical solutions alongside global optimization results
- **Interactive Visualization** — Animated mechanism with link/joint IDs, coupler curve overlay, error shading
- **Educational Walkthrough** — Step-by-step theory for type, number, and dimensional synthesis
- **Roberts-Chebyshev Cognates** — View all 3 equivalent 4-bar mechanisms
- **Kinematic Inversion** — Fix different links and re-synthesize
- **Export** — JSON, CSV, PDF report (educational + concise), GIF animation, DXF/SVG for CAD

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS + Zustand |
| Backend | Python FastAPI + Celery + Redis |
| Optimization | SciPy + NumPy + custom GA/PSO/SA |
| Export | ReportLab (PDF), ezdxf (DXF), Pillow (GIF) |

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Start Celery worker (uses solo pool on Windows, prefork on Linux/macOS)
celery -A app.core.celery_app worker --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

### Docker Compose (all services)

```bash
cd backend
docker-compose up --build
```

## Deployment

- **Frontend** → Vercel (zxynth.vercel.app → zxynth.xyz)
- **Backend** → Railway (FastAPI + Celery worker + Redis)

See `docs/DEPLOYMENT.md` for detailed instructions.

## License

All Rights Reserved © Sankar Balasubramanian

---

Made with ❤️ by [Sankar Balasubramanian](https://www.linkedin.com/in/sankar4) | [sankar.studio](https://sankar.studio)
