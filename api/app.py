"""
app.py — FastAPI application.
Section 5 of PLAN.md.

Lifespan loads model artifacts. Four endpoints:
  GET  /api/health   — Models loaded, artifact version, dataset hash
  GET  /api/schema   — Feature list for the intake form
  POST /api/predict   — Validated patient in, four predictions + explanations out
  GET  /api/metrics   — Contents of reports/*.json for the evaluation page

Serves the built frontend in production.
"""

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.models import (
    ErrorDetail,
    HealthResponse,
    PatientInput,
    PredictionResponse,
    SchemaFeatureInfo,
    SchemaResponse,
    SingleExplanation,
    SinglePrediction,
    ShapFeature,
)

logger = logging.getLogger("cardiovision")

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = ROOT / "artifacts"
REPORTS_DIR = ARTIFACTS_DIR / "reports"
DATA_DIR = ROOT / "data"
SCHEMA_PATH = DATA_DIR / "schema.json"
WEB_DIST = ROOT / "web" / "dist"

TARGETS = ["cad", "lad", "lcx", "rca"]

# ── Global state ───────────────────────────────────────────────────────
models: dict[str, Any] = {}
metadata: dict[str, dict] = {}
schema_data: dict = {}
feature_groups: dict = {}
SHAP_BACKGROUND_SIZE = 50


def load_artifacts():
    """Load all model artifacts at startup."""
    global schema_data, feature_groups

    # Load schema
    if not SCHEMA_PATH.exists():
        raise RuntimeError(f"Schema not found: {SCHEMA_PATH}. Run 'make train' first.")

    with open(SCHEMA_PATH) as f:
        schema_data = json.load(f)

    feature_groups = schema_data.get("feature_groups", {})

    # Load models
    for target in TARGETS:
        target_dir = ARTIFACTS_DIR / "v1" / target
        model_path = target_dir / "model.joblib"
        meta_path = target_dir / "metadata.json"

        if not model_path.exists():
            logger.warning(f"Model not found for {target}: {model_path}")
            continue

        try:
            models[target] = joblib.load(model_path)
            if meta_path.exists():
                with open(meta_path) as f:
                    metadata[target] = json.load(f)
            logger.info(f"Loaded model: {target} from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model {target}: {e}")
            raise RuntimeError(
                f"Corrupt artifact for {target}: {e}. "
                "Re-run 'make train' to regenerate."
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load artifacts at startup."""
    try:
        load_artifacts()
        logger.info(f"Loaded {len(models)} models: {list(models.keys())}")
    except RuntimeError as e:
        logger.error(f"Startup failed: {e}")
        # Don't crash — allow health check to report the issue
    yield


# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CardioVision 3D API",
    description=(
        "Cardiovascular Risk Visualization & Prediction. "
        "Educational demonstration — not a diagnostic device."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handlers ─────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# ── Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Models loaded, artifact version, dataset hash."""
    dataset_hash = schema_data.get("dataset", {}).get("sha256", "unknown")
    return HealthResponse(
        status="ok" if len(models) == 4 else "degraded",
        models_loaded=list(models.keys()),
        artifact_version="v1",
        dataset_hash=dataset_hash,
    )


@app.get("/api/schema", response_model=SchemaResponse)
async def get_schema():
    """Feature list with type, unit, range, categories, group, required flag."""
    if not schema_data:
        raise HTTPException(status_code=503, detail="Schema not loaded. Run 'make train' first.")

    columns = schema_data.get("columns", {})
    forbidden = set(schema_data.get("forbidden", []))
    features = []
    groups_seen = set()

    for col_name, col_info in columns.items():
        if col_name in forbidden:
            continue

        group = col_info.get("group", "Other")
        groups_seen.add(group)

        feature = SchemaFeatureInfo(
            name=col_name,
            type=col_info.get("type", "numeric"),
            group=group,
            required=col_info.get("required", False),
            min_val=col_info.get("min"),
            max_val=col_info.get("max"),
            mean=col_info.get("mean"),
            median=col_info.get("median"),
            categories=col_info.get("categories"),
        )
        features.append(feature)

    # Order groups
    group_order = ["Demographics", "Vitals", "Labs", "ECG", "Echo", "Risk Factors", "Other"]
    ordered_groups = [g for g in group_order if g in groups_seen]

    return SchemaResponse(
        features=features,
        groups=ordered_groups,
        n_features=len(features),
    )


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(patient: PatientInput):
    """
    Validated patient in, four predictions + explanations out.
    Missing optional fields are imputed and listed in imputed_features.
    """
    # Check models are loaded
    missing_models = [t for t in TARGETS if t not in models]
    if missing_models:
        raise HTTPException(
            status_code=503,
            detail=f"Models not loaded: {missing_models}. Run 'make train' first.",
        )

    # Convert patient input to DataFrame row
    patient_dict = patient.model_dump(by_alias=True)

    # Track imputed features
    imputed_features = []
    feature_list = schema_data.get("feature_allowlist", [])
    columns_info = schema_data.get("columns", {})

    # Build the input row with all features
    row = {}
    for feat in feature_list:
        # Map aliased field names back
        alias_map = {
            "Systolic Murmur": "Systolic_Murmur",
            "Diastolic Murmur": "Diastolic_Murmur",
            "Exertional CP": "Exertional_CP",
            "LowTH Ang": "LowTH_Ang",
            "Typical Chest Pain": "Typical_Chest_Pain",
            "Q Wave": "Q_Wave",
            "St Elevation": "St_Elevation",
            "St Depression": "St_Depression",
            "T inversion": "T_inversion",
            "Poor R Progression": "Poor_R_Progression",
            "EF-TTE": "EF_TTE",
            "Region RWMA": "Region_RWMA",
            "Current Smoker": "Current_Smoker",
            "EX-Smoker": "EX_Smoker",
            "Airway disease": "Airway_disease",
            "Thyroid Disease": "Thyroid_Disease",
        }

        # Try direct lookup, then alias
        val = patient_dict.get(feat)
        if val is None:
            alias_key = alias_map.get(feat)
            if alias_key:
                val = patient_dict.get(alias_key)

        if val is None:
            # Impute from schema
            col_info = columns_info.get(feat, {})
            if col_info.get("type") in ("numeric", "binary"):
                val = col_info.get("median", col_info.get("mean", 0))
            else:
                cats = col_info.get("categories", [])
                val = cats[0] if cats else 0
            imputed_features.append(feat)

        row[feat] = val

    input_df = pd.DataFrame([row])

    # ── Run predictions ────────────────────────────────────────────────
    predictions = {}
    explanations = {}

    for target in TARGETS:
        model = models[target]
        target_metadata = metadata.get(target, {})
        threshold = target_metadata.get("threshold", 0.5)
        feature_list_model = target_metadata.get("feature_list", list(input_df.columns))

        # Ensure column order matches training
        model_input = input_df.reindex(columns=feature_list_model)

        # Predict
        try:
            prob = float(model.predict_proba(model_input)[:, 1][0])
            label = int(prob >= threshold)
        except Exception as e:
            logger.error(f"Prediction failed for {target}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Prediction failed for {target}: {e}",
            )

        predictions[target] = SinglePrediction(
            label=label,
            probability=round(prob, 4),
            threshold=threshold,
            calibrated=True,
        )

        # ── SHAP explanation for this patient ──────────────────────────
        try:
            pipeline = model
            preprocessor = pipeline.named_steps["preprocessor"]
            classifier = pipeline.named_steps["classifier"]

            # Get the base calibrated classifier
            if hasattr(classifier, "estimators_"):
                # CalibratedClassifierCV wraps the actual model
                base_classifier = classifier.estimators_[0].estimator
            elif hasattr(classifier, "calibrated_classifiers_"):
                base_classifier = classifier.calibrated_classifiers_[0].estimator
            else:
                base_classifier = classifier

            transformed = preprocessor.transform(model_input)
            classifier_type = type(base_classifier).__name__

            # Try to get transformed feature names
            try:
                transformed_names = preprocessor.get_feature_names_out()
                transformed_names = [str(n) for n in transformed_names]
            except Exception:
                transformed_names = [f"feat_{i}" for i in range(transformed.shape[1])]

            # Choose explainer
            if classifier_type in ("RandomForestClassifier", "GradientBoostingClassifier"):
                explainer = shap.TreeExplainer(base_classifier)
                sv = explainer.shap_values(transformed)
                if isinstance(sv, list):
                    sv = sv[1]
                exp_arr = np.asarray(explainer.expected_value).ravel()
                base_val = float(exp_arr[1] if len(exp_arr) > 1 else exp_arr[0])
            else:
                # Use predict_proba as the model function
                explainer = shap.KernelExplainer(
                    base_classifier.predict_proba,
                    shap.kmeans(transformed, min(20, transformed.shape[0])),
                )
                sv = explainer.shap_values(transformed, nsamples=50)
                if isinstance(sv, list):
                    sv = sv[1]
                exp_arr = np.asarray(explainer.expected_value).ravel()
                base_val = float(exp_arr[1] if len(exp_arr) > 1 else exp_arr[0])
            # shap_values could be a list of arrays (class 0, class 1), or an array of shape (n_samples, n_features, n_classes)
            if isinstance(sv, list):
                # Older SHAP version returns list
                sv = sv[1] if len(sv) > 1 else sv[0]
            
            if getattr(sv, "ndim", 1) == 3:
                # Shape (n_samples, n_features, n_classes)
                sv = sv[:, :, 1]
                
            if getattr(sv, "ndim", 1) == 2:
                # Shape (1, n_features)
                shap_values = sv[0]
            else:
                shap_values = sv

            # Map to source features and build top list
            col_to_group = {}
            for gname, gcols in feature_groups.items():
                for c in gcols:
                    col_to_group[c] = gname

            # Map transformed features back to originals
            source_shap = {}
            for i, tname in enumerate(transformed_names):
                source = None
                for orig_col in feature_list_model:
                    if orig_col in tname:
                        source = orig_col
                        break
                if source is None:
                    parts = tname.split("__")
                    source = parts[-1].split("_")[0] if len(parts) >= 2 else tname

                if source not in source_shap:
                    source_shap[source] = 0.0
                if i < len(shap_values):
                    source_shap[source] += float(shap_values[i])

            # Build top features
            sorted_feats = sorted(source_shap.items(), key=lambda x: abs(x[1]), reverse=True)
            with open("debug.txt", "a") as f:
                f.write(f"Target: {target}\n")
                f.write(f"transformed_names: {len(transformed_names)}\n")
                f.write(f"shap_values len: {len(shap_values)} shape: {getattr(shap_values, 'shape', 'none')}\n")
                f.write(f"source_shap keys: {len(source_shap)}\n")
                f.write(f"sorted_feats: {sorted_feats[:10]}\n")
            top = []
            for feat, shap_val in sorted_feats[:10]:
                raw_val = row.get(feat, 0) if feat in row else 0.0
                try:
                    input_val = float(raw_val)
                except (ValueError, TypeError):
                    input_val = 0.0
                group = col_to_group.get(feat, "Other")
                top.append(ShapFeature(
                    feature=feat,
                    value=round(input_val, 4),
                    shap=round(shap_val, 6),
                    group=group,
                ))

            # Group-level SHAP
            by_group = {}
            for feat, shap_val in source_shap.items():
                g = col_to_group.get(feat, "Other")
                by_group[g] = by_group.get(g, 0) + shap_val
            by_group = {k: round(v, 6) for k, v in by_group.items()}

            explanations[target] = SingleExplanation(
                base_value=round(base_val, 6),
                top=top,
                by_group=by_group,
            )

        except Exception as e:
            logger.error(f"SHAP failed for {target}: {e}", exc_info=True)
            import traceback
            err_msg = traceback.format_exc()
            try:
                err_msg += f"\nexpected_value: {getattr(explainer, 'expected_value', 'N/A')}\ntype: {type(getattr(explainer, 'expected_value', None))}"
            except:
                pass
            with open("shap_error.txt", "w") as f:
                f.write(err_msg)
            explanations[target] = SingleExplanation(
                base_value=0.0,
                top=[],
                by_group={},
            )

    return PredictionResponse(
        model_version="v1",
        imputed_features=imputed_features,
        predictions=predictions,
        explanations=explanations,
        disclaimer="Educational demonstration. Not a diagnostic device.",
    )


@app.get("/api/metrics")
async def get_metrics():
    """Contents of reports/*.json for the evaluation page."""
    if not REPORTS_DIR.exists():
        raise HTTPException(
            status_code=503,
            detail="Reports not found. Run 'make train' first.",
        )

    metrics = {}
    for target in TARGETS:
        report_path = REPORTS_DIR / f"{target}.json"
        if report_path.exists():
            with open(report_path) as f:
                metrics[target] = json.load(f)
        else:
            metrics[target] = {"error": f"Report not found for {target}"}

    # Include metadata summaries
    meta_summaries = {}
    for target in TARGETS:
        if target in metadata:
            m = metadata[target]
            meta_summaries[target] = {
                "model_type": m.get("model_type"),
                "test_metrics": m.get("test_metrics"),
                "n_train": m.get("n_train"),
                "n_test": m.get("n_test"),
                "threshold": m.get("threshold"),
            }

    return {
        "reports": metrics,
        "metadata": meta_summaries,
        "disclaimer": "Educational demonstration. Not a diagnostic device.",
    }


# ── Serve frontend in production ───────────────────────────────────────
if WEB_DIST.exists():
    app.mount("/", StaticFiles(directory=str(WEB_DIST), html=True), name="static")
