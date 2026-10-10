"""
models.py — Pydantic v2 models for the API contract.
Section 5 of PLAN.md.

These models define the exact response shape that the frontend
types are generated from via openapi-typescript.
"""

from typing import Optional

from pydantic import BaseModel, Field


# ── Request Models ─────────────────────────────────────────────────────

class PatientInput(BaseModel):
    """
    Patient clinical data input.
    Required fields are rejected with 422 if absent.
    Optional fields are imputed with training median/mode.
    """
    # Demographics
    Age: float = Field(..., ge=0, le=120, description="Patient age in years")
    Sex: int = Field(..., ge=0, le=1, description="Sex (0=Female, 1=Male)")
    Weight: Optional[float] = Field(None, ge=20, le=300, description="Weight in kg")
    Length: Optional[float] = Field(None, ge=100, le=250, description="Height in cm")
    BMI: Optional[float] = Field(None, ge=10, le=60, description="Body Mass Index")

    # Vitals
    BP: float = Field(..., ge=60, le=250, description="Blood Pressure (mmHg)")
    PR: float = Field(..., ge=30, le=220, description="Pulse Rate (bpm)")
    Systolic_Murmur: Optional[int] = Field(None, ge=0, le=1, alias="Systolic Murmur")
    Diastolic_Murmur: Optional[int] = Field(None, ge=0, le=1, alias="Diastolic Murmur")
    Dyspnea: Optional[int] = Field(None, ge=0, le=1)
    Atypical: Optional[int] = Field(None, ge=0, le=1)
    Nonanginal: Optional[int] = Field(None, ge=0, le=1)
    Exertional_CP: Optional[int] = Field(None, ge=0, le=1, alias="Exertional CP")
    LowTH_Ang: Optional[int] = Field(None, ge=0, le=1, alias="LowTH Ang")
    Typical_Chest_Pain: Optional[int] = Field(None, ge=0, le=1, alias="Typical Chest Pain")

    # Labs
    FBS: float = Field(..., ge=50, le=500, description="Fasting Blood Sugar (mg/dL)")
    CR: float = Field(..., ge=0.1, le=15, description="Creatinine (mg/dL)")
    TG: float = Field(..., ge=20, le=1000, description="Triglycerides (mg/dL)")
    LDL: float = Field(..., ge=10, le=400, description="LDL Cholesterol (mg/dL)")
    HDL: float = Field(..., ge=10, le=150, description="HDL Cholesterol (mg/dL)")
    BUN: Optional[float] = Field(None, ge=1, le=100, description="Blood Urea Nitrogen")
    ESR: Optional[float] = Field(None, ge=0, le=150, description="Erythrocyte Sedimentation Rate")
    HB: float = Field(..., ge=5, le=25, description="Hemoglobin (g/dL)")
    K: float = Field(..., ge=2, le=8, description="Potassium (mEq/L)")
    Na: float = Field(..., ge=120, le=160, description="Sodium (mEq/L)")
    WBC: float = Field(..., ge=1000, le=30000, description="White Blood Cell Count")
    Lymph: Optional[float] = Field(None, ge=0, le=100, description="Lymphocyte %")
    Neut: Optional[float] = Field(None, ge=0, le=100, description="Neutrophil %")
    PLT: Optional[float] = Field(None, ge=50, le=800, description="Platelet Count (×10³/μL)")

    # ECG
    Q_Wave: Optional[int] = Field(None, ge=0, le=1, alias="Q Wave")
    St_Elevation: Optional[int] = Field(None, ge=0, le=1, alias="St Elevation")
    St_Depression: Optional[int] = Field(None, ge=0, le=1, alias="St Depression")
    T_inversion: Optional[int] = Field(None, ge=0, le=1, alias="T inversion")
    LVH: Optional[int] = Field(None, ge=0, le=1)
    Poor_R_Progression: Optional[int] = Field(None, ge=0, le=1, alias="Poor R Progression")

    # Echo
    EF_TTE: float = Field(..., ge=10, le=80, alias="EF-TTE", description="Ejection Fraction (%)")
    Region_RWMA: Optional[int] = Field(None, ge=0, le=4, alias="Region RWMA")
    VHD: Optional[str] = Field(None, description="Valvular Heart Disease")

    # Risk Factors
    DM: Optional[int] = Field(None, ge=0, le=1, description="Diabetes Mellitus")
    HTN: Optional[int] = Field(None, ge=0, le=1, description="Hypertension")
    Current_Smoker: Optional[int] = Field(None, ge=0, le=1, alias="Current Smoker")
    EX_Smoker: Optional[int] = Field(None, ge=0, le=1, alias="EX-Smoker")
    FH: Optional[int] = Field(None, ge=0, le=1, description="Family History")
    Obesity: Optional[int] = Field(None, ge=0, le=1)
    CRF: Optional[int] = Field(None, ge=0, le=1, description="Chronic Renal Failure")
    CVA: Optional[int] = Field(None, ge=0, le=1, description="Cerebrovascular Accident")
    Airway_disease: Optional[int] = Field(None, ge=0, le=1, alias="Airway disease")
    Thyroid_Disease: Optional[int] = Field(None, ge=0, le=1, alias="Thyroid Disease")

    model_config = {"populate_by_name": True}


# ── Response Models ────────────────────────────────────────────────────

class SinglePrediction(BaseModel):
    """Prediction for one target (cad, lad, lcx, or rca)."""
    label: int = Field(..., description="Binary prediction (0 or 1)")
    probability: float = Field(..., ge=0, le=1, description="Calibrated probability")
    threshold: float = Field(..., description="Decision threshold used")
    calibrated: bool = Field(True, description="Whether the probability is calibrated")


class ShapFeature(BaseModel):
    """A single SHAP feature contribution."""
    feature: str
    value: float = Field(..., description="Input value for this feature")
    shap: float = Field(..., description="SHAP contribution")
    group: str = Field(..., description="Feature group (Demographics, Vitals, etc.)")


class SingleExplanation(BaseModel):
    """SHAP explanation for one target model."""
    base_value: float
    top: list[ShapFeature] = Field(default_factory=list)
    by_group: dict[str, float] = Field(default_factory=dict)


class PredictionResponse(BaseModel):
    """
    Full prediction response — carries everything the dashboard
    and the 3D scene need. Section 5 of PLAN.md.
    """
    model_version: str = "v1"
    imputed_features: list[str] = Field(
        default_factory=list,
        description="Features that were imputed because they were not provided"
    )
    predictions: dict[str, SinglePrediction]
    explanations: dict[str, SingleExplanation]
    disclaimer: str = "Educational demonstration. Not a diagnostic device."


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    models_loaded: list[str] = Field(default_factory=list)
    artifact_version: str = "v1"
    dataset_hash: str = ""


class SchemaFeatureInfo(BaseModel):
    """Schema info for a single feature."""
    name: str
    type: str  # "numeric", "binary", "categorical"
    group: str
    required: bool
    unit: Optional[str] = None
    min_val: Optional[float] = Field(None, alias="min")
    max_val: Optional[float] = Field(None, alias="max")
    mean: Optional[float] = None
    median: Optional[float] = None
    categories: Optional[list[str]] = None
    description: Optional[str] = None

    model_config = {"populate_by_name": True}


class SchemaResponse(BaseModel):
    """Feature schema for the intake form."""
    features: list[SchemaFeatureInfo]
    groups: list[str]
    n_features: int


class ErrorDetail(BaseModel):
    """Structured error response."""
    detail: str
    field_errors: Optional[dict[str, str]] = None
