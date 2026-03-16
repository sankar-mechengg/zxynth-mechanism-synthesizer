# Zxynth API Documentation

## Base URL

- **Development:** `http://localhost:8000/api`
- **Production:** `https://your-railway-url.up.railway.app/api`

---

## Health & Monitoring

### `GET /api/health`

Check API and Redis connectivity.

**Response:**
```json
{
  "status": "healthy",
  "api": true,
  "redis": true,
  "environment": "development"
}
```

### `GET /api/queue/status`

Get Celery queue statistics.

**Response:**
```json
{
  "queue": {
    "connected_clients": 3,
    "total_jobs": 12,
    "by_status": { "complete": 8, "running": 1, "queued": 1, "failed": 2 }
  },
  "config": {
    "maxConcurrency": 2,
    "jobTimeout": 120,
    "maxQueueSize": 50
  }
}
```

---

## Synthesis

### `POST /api/synthesize`

Submit a mechanism synthesis job. Returns a job ID for polling.

**Request Body (Path Generation):**
```json
{
  "problemType": "path",
  "mechanismType": "four_bar",
  "algorithm": "de",
  "hyperparams": {
    "populationSize": 100,
    "maxGenerations": 400,
    "numSeeds": 6
  },
  "constraints": {
    "tolerance": 5.0,
    "minTransmissionAngle": 40.0,
    "grashofRequired": true,
    "groundPivot1": null,
    "groundPivot2": null
  },
  "desiredPath": [[0, 0], [1.82, 0.06], [3.64, 0.26], ...],
  "prescribedTiming": false,
  "timingMap": null,
  "crankRange": [0, 360]
}
```

**Request Body (Function Generation):**
```json
{
  "problemType": "function",
  "mechanismType": "four_bar",
  "algorithm": "de",
  "hyperparams": { ... },
  "constraints": { ... },
  "functionData": {
    "type": "expression",
    "expression": "90 * sin(pi * x)",
    "thetaInRange": [0, 180],
    "pairs": [[0, 0], [30, 25.5], [60, 45.0], ...]
  }
}
```

**Request Body (Motion Generation):**
```json
{
  "problemType": "motion",
  "mechanismType": "four_bar",
  "algorithm": "de",
  "hyperparams": { ... },
  "constraints": { ... },
  "poses": [[0, 0, 0], [30, 40, 25], [60, 60, 50]]
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "a1b2c3d4e5f6",
  "status": "queued"
}
```

### `GET /api/job/{job_id}/status`

Poll job status and optimization progress.

**Response (Running):**
```json
{
  "jobId": "a1b2c3d4e5f6",
  "status": "running",
  "generation": 142,
  "bestFitness": 2.3456,
  "error": null
}
```

**Status values:** `queued`, `running`, `complete`, `failed`, `cancelled`

### `GET /api/job/{job_id}/result`

Get full synthesis result (only available when status = complete).

**Response:**
```json
{
  "jobId": "a1b2c3d4e5f6",
  "result": {
    "analytical": {
      "mechanism": { "type": "four_bar", "a1": 52.68, "a2": 23.48, ... },
      "couplerCurve": [[x, y], ...],
      "errorMetrics": { "mean": 0.63, "max": 1.37, "rms": 0.73, ... },
      "grashofType": "crank-rocker",
      "transmissionAngle": { "min": 40.0, "max": 140.0 },
      "method": "Freudenstein 3-point",
      "precisionPoints": 3
    },
    "optimization": {
      "mechanism": { ... },
      "couplerCurve": [[x, y], ...],
      "errorMetrics": { ... },
      "grashofType": "crank-rocker",
      "transmissionAngle": { ... },
      "algorithm": "DE",
      "generations": 400,
      "elapsed": 12.5
    },
    "cognates": [
      { "a1": 52.68, "a2": 23.48, ..., "label": "Original" },
      { "a1": 39.2, "a2": 17.5, ..., "label": "Cognate 2" },
      { "a1": 44.1, "a2": 19.7, ..., "label": "Cognate 3" }
    ]
  }
}
```

### `POST /api/inversion`

Compute kinematic inversion (synchronous — no polling needed).

**Request:**
```json
{
  "jobId": "a1b2c3d4e5f6",
  "fixedLinkIndex": 2,
  "mechanism": { "a1": 52.68, "a2": 23.48, ... }
}
```

**Response:**
```json
{
  "fixedLink": 2,
  "mechanism": { "a1": 35.76, "a2": 45.40, ... },
  "grashofType": "double-rocker",
  "transmissionAngle": { "min": 28.5, "max": 151.5 },
  "couplerCurve": [[x, y], ...],
  "description": "Fixed: Coupler (L3). Neither pivoted link rotates fully."
}
```

---

## Parsing

### `POST /api/parse/svg`

Upload and parse an SVG file. Returns sampled path points.

**Request:** `multipart/form-data` with `file` field (.svg)

**Response:**
```json
{
  "points": [[x, y], ...],
  "numPoints": 101,
  "bounds": { "minX": 3.03, "minY": 93.03, "maxX": 608.97, "maxY": 698.97 },
  "pathData": "M608.97,93.03 A605.94,605.94 0 0 0 3.03,698.97"
}
```

### `POST /api/parse/csv?mode=path`

Upload and parse a CSV file. Mode: `path` (x,y) or `function` (θ_in, θ_out).

**Request:** `multipart/form-data` with `file` field (.csv)

**Response (path mode):**
```json
{
  "points": [[0, 0], [1.82, 0.06], ...],
  "numPoints": 101,
  "hasHeader": false,
  "warnings": []
}
```

---

## Export

All export endpoints accept POST with mechanism data and return a downloadable file.

### `POST /api/export/pdf`

**Options:** `{ "mode": "full" }` or `{ "mode": "concise" }`

Returns: `application/pdf`

### `POST /api/export/gif`

**Options:** `{ "width": 800, "height": 600, "fps": 30, "startAngle": 0, "endAngle": 360 }`

Returns: `image/gif`

### `POST /api/export/dxf`

**Options:** `{ "includeMechanism": true, "includeCouplerCurve": true, "includeDesiredPath": true }`

Returns: `application/dxf`

### `POST /api/export/svg`

Same options as DXF. Returns: `image/svg+xml`

### `POST /api/export/json`

Returns: `application/json`

### `POST /api/export/csv`

Returns: `text/csv`

---

## Mechanism Types

| ID | Label | Links | Joints | DOF |
|---|---|---|---|---|
| `four_bar` | 4-Bar Linkage | 4 | 4R | 1 |
| `six_bar_watt` | 6-Bar Watt-I | 6 | 7R | 1 |
| `six_bar_stephenson` | 6-Bar Stephenson-III | 6 | 7R | 1 |
| `slider_crank` | Slider-Crank | 4 | 3R+1P | 1 |

## Algorithms

| ID | Name | Type | Best For |
|---|---|---|---|
| `de` | Differential Evolution | Population + Local Refinement | General (recommended) |
| `ga` | Genetic Algorithm | Population Evolutionary | Large discontinuous spaces |
| `pso` | Particle Swarm | Swarm Intelligence | Smooth landscapes |
| `sa` | Simulated Annealing | Single Solution Stochastic | Fine-tuning |

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Invalid request (bad data, wrong format) |
| 404 | Job not found |
| 409 | Job not complete (result requested before completion) |
| 500 | Internal error (synthesis/export failure) |
