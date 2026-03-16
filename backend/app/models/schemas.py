"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Tuple, Dict, Any
from .enums import ProblemType, MechanismType, Algorithm, GrashofType, JobStatus


# ── Sub-models ──────────────────────────────────────────────────


class Hyperparams(BaseModel):
    """Optimization algorithm hyperparameters."""
    populationSize: int = Field(100, ge=10, le=1000)
    maxGenerations: int = Field(400, ge=10, le=10000)
    numSeeds: int = Field(6, ge=1, le=30)
    # GA-specific
    crossoverRate: Optional[float] = Field(None, ge=0.0, le=1.0)
    mutationRate: Optional[float] = Field(None, ge=0.0, le=1.0)
    # PSO-specific
    inertiaWeight: Optional[float] = Field(None, ge=0.0, le=2.0)
    cognitiveWeight: Optional[float] = Field(None, ge=0.0, le=5.0)
    socialWeight: Optional[float] = Field(None, ge=0.0, le=5.0)
    # SA-specific
    initialTemp: Optional[float] = Field(None, ge=1.0)
    coolingRate: Optional[float] = Field(None, ge=0.8, le=0.9999)
    restartThreshold: Optional[int] = Field(None, ge=10)


class Constraints(BaseModel):
    """Synthesis constraints."""
    tolerance: float = Field(5.0, ge=0.01, le=100.0, description="Error tolerance in %")
    minTransmissionAngle: float = Field(40.0, ge=0.0, le=90.0, description="Min transmission angle in degrees")
    grashofRequired: bool = Field(True, description="Whether Grashof condition is enforced")
    groundPivot1: Optional[List[float]] = Field(None, description="Fixed ground pivot A [x, y]")
    groundPivot2: Optional[List[float]] = Field(None, description="Fixed ground pivot D [x, y]")


class FunctionData(BaseModel):
    """Function generation input data."""
    type: str = Field(..., description="'expression' | 'csv' | 'discrete'")
    expression: Optional[str] = None
    thetaInRange: Optional[List[float]] = None
    pairs: List[List[float]] = Field(..., description="[[theta_in, theta_out], ...]")


class TimingMapping(BaseModel):
    """A single timing constraint: path point index → crank angle."""
    pointIndex: int = Field(..., ge=0)
    crankAngle: float


# ── Request Models ──────────────────────────────────────────────


class SynthesisRequest(BaseModel):
    """Main synthesis request payload."""
    problemType: ProblemType
    mechanismType: MechanismType = MechanismType.FOUR_BAR
    algorithm: Algorithm = Algorithm.DE
    hyperparams: Hyperparams = Hyperparams()
    constraints: Constraints = Constraints()

    # Path generation fields
    desiredPath: Optional[List[List[float]]] = Field(None, description="[[x,y], ...] desired path points")
    prescribedTiming: bool = False
    timingMap: Optional[List[TimingMapping]] = None
    crankRange: List[float] = Field([0.0, 360.0], description="[startDeg, endDeg]")

    # Function generation fields
    functionData: Optional[FunctionData] = None

    # Motion generation fields
    poses: Optional[List[List[float]]] = Field(None, description="[[x, y, theta_deg], ...] precision poses")


# ── Response Models ─────────────────────────────────────────────


class MechanismParams(BaseModel):
    """Synthesized mechanism parameters."""
    type: Optional[str] = None
    a1: Optional[float] = None
    a2: Optional[float] = None
    a3: Optional[float] = None
    a4: Optional[float] = None
    a5: Optional[float] = None
    a6: Optional[float] = None
    p: Optional[float] = None
    alpha: Optional[float] = None
    offset: Optional[float] = None
    pivotA: Optional[List[float]] = None
    pivotD: Optional[List[float]] = None
    pivotE: Optional[List[float]] = None
    groundAngle: Optional[float] = None
    groundLength: Optional[float] = None
    theta2_0: Optional[float] = None
    theta3_0: Optional[float] = None
    theta4_0: Optional[float] = None
    couplerPointX: Optional[float] = None
    couplerPointY: Optional[float] = None
    grashofMargin: Optional[float] = None


class ErrorMetrics(BaseModel):
    """Path error metrics."""
    mean: float
    max: float
    rms: float
    meanPercent: Optional[float] = None
    maxPercent: Optional[float] = None
    rmsPercent: Optional[float] = None


class TransmissionAngleInfo(BaseModel):
    """Transmission angle range."""
    min: float
    max: float


class DefectInfo(BaseModel):
    """Defect detection results."""
    branch: bool = False
    order: bool = False
    details: List[str] = []


class SynthesisResult(BaseModel):
    """Result from a single synthesis method (analytical or optimization)."""
    mechanism: Optional[MechanismParams] = None
    couplerCurve: Optional[List[List[float]]] = None
    errorMetrics: Optional[ErrorMetrics] = None
    grashofType: Optional[str] = None
    transmissionAngle: Optional[TransmissionAngleInfo] = None
    defects: Optional[DefectInfo] = None
    method: Optional[str] = None
    precisionPoints: Optional[int] = None
    algorithm: Optional[str] = None
    generations: Optional[int] = None
    elapsed: Optional[float] = None
    warnings: List[str] = []


class FullSynthesisResult(BaseModel):
    """Complete synthesis result including analytical, optimization, and cognates."""
    analytical: Optional[SynthesisResult] = None
    optimization: Optional[SynthesisResult] = None
    cognates: Optional[List[MechanismParams]] = None


# ── Job Status Models ───────────────────────────────────────────


class JobSubmitResponse(BaseModel):
    """Response when a synthesis job is submitted."""
    jobId: str
    status: str = "queued"


class JobStatusResponse(BaseModel):
    """Response when polling job status."""
    jobId: str
    status: JobStatus
    generation: int = 0
    bestFitness: Optional[float] = None
    error: Optional[str] = None


class JobResultResponse(BaseModel):
    """Response when fetching completed job result."""
    jobId: str
    result: FullSynthesisResult


# ── Export Models ───────────────────────────────────────────────


class ExportRequest(BaseModel):
    """Export request payload."""
    mechanism: MechanismParams
    couplerCurve: Optional[List[List[float]]] = None
    desiredPath: Optional[List[List[float]]] = None
    errorMetrics: Optional[ErrorMetrics] = None
    cognates: Optional[List[MechanismParams]] = None
    options: Dict[str, Any] = {}


class InversionRequest(BaseModel):
    """Kinematic inversion request."""
    jobId: str
    fixedLinkIndex: int = Field(..., ge=0, le=5)
    mechanism: MechanismParams
