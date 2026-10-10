"""
train.py — Train four independent pipelines (CAD, LAD, LCX, RCA).
Section 4.3–4.10 of PLAN.md.

One shared stratified 80/20 split. Each target gets its own pipeline
with preprocessing, candidate selection via repeated stratified CV,
calibration, and SHAP explanations. Touch the test set exactly once.
"""

import json
import hashlib
import platform
import subprocess
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import (
    RepeatedStratifiedKFold,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.svm import SVC
import shap

from ml.features import FORBIDDEN, TARGETS, build_xy, flag_suspicious_features, load_schema

warnings.filterwarnings("ignore", category=FutureWarning)

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = ROOT / "artifacts"
REPORTS_DIR = ARTIFACTS_DIR / "reports"
DATA_DIR = ROOT / "data"
SPLIT_PATH = ARTIFACTS_DIR / "split.json"

RANDOM_SEED = 42
TEST_SIZE = 0.20
N_CV_REPEATS = 3
N_CV_FOLDS = 5
N_BOOTSTRAP = 1000
SHAP_BACKGROUND_SIZE = 50


def get_git_sha() -> str:
    """Get the current git SHA, or 'unknown'."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(ROOT),
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except Exception:
        return "unknown"


def get_library_versions() -> dict:
    """Record library versions for reproducibility."""
    import sklearn
    return {
        "python": platform.python_version(),
        "scikit-learn": sklearn.__version__,
        "pandas": pd.__version__,
        "numpy": np.__version__,
        "shap": shap.__version__,
        "joblib": joblib.__version__,
    }


def build_preprocessor(X: pd.DataFrame, schema: dict) -> ColumnTransformer:
    """
    Build the preprocessing pipeline from the schema.
    Section 4.4: numeric gets median impute + scaling;
    binary/categorical gets mode impute + one-hot.
    """
    columns_info = schema.get("columns", {})

    numeric_cols = []
    categorical_cols = []

    for col in X.columns:
        col_info = columns_info.get(col, {})
        col_type = col_info.get("type", "numeric")

        if col_type in ("categorical", "binary"):
            categorical_cols.append(col)
        else:
            numeric_cols.append(col)

    # Numeric pipeline: median impute -> scale
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    # Categorical pipeline: mode impute -> one-hot
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    transformers = []
    if numeric_cols:
        transformers.append(("num", numeric_pipeline, numeric_cols))
    if categorical_cols:
        transformers.append(("cat", categorical_pipeline, categorical_cols))

    return ColumnTransformer(transformers, remainder="drop")


def get_candidates(preprocessor: ColumnTransformer) -> dict:
    """
    Section 4.5: Candidate models with small hyperparameter grids.
    """
    return {
        "dummy": {
            "pipeline": Pipeline([
                ("preprocessor", preprocessor),
                ("classifier", DummyClassifier(strategy="stratified", random_state=RANDOM_SEED)),
            ]),
            "label": "Dummy (Stratified)",
        },
        "logistic": {
            "pipeline": Pipeline([
                ("preprocessor", preprocessor),
                ("classifier", LogisticRegression(
                    C=1.0,
                    class_weight="balanced",
                    max_iter=1000,
                    random_state=RANDOM_SEED,
                    solver="lbfgs",
                )),
            ]),
            "label": "Logistic Regression (L2, balanced)",
        },
        "random_forest": {
            "pipeline": Pipeline([
                ("preprocessor", preprocessor),
                ("classifier", RandomForestClassifier(
                    n_estimators=200,
                    max_depth=10,
                    min_samples_leaf=5,
                    class_weight="balanced",
                    random_state=RANDOM_SEED,
                    n_jobs=-1,
                )),
            ]),
            "label": "Random Forest",
        },
        "svc": {
            "pipeline": Pipeline([
                ("preprocessor", preprocessor),
                ("classifier", SVC(
                    kernel="rbf",
                    probability=True,
                    class_weight="balanced",
                    random_state=RANDOM_SEED,
                )),
            ]),
            "label": "SVC (RBF, balanced)",
        },
        "gradient_boosting": {
            "pipeline": Pipeline([
                ("preprocessor", preprocessor),
                ("classifier", GradientBoostingClassifier(
                    n_estimators=200,
                    max_depth=4,
                    learning_rate=0.1,
                    min_samples_leaf=10,
                    random_state=RANDOM_SEED,
                )),
            ]),
            "label": "Gradient Boosting",
        },
    }


def evaluate_candidates(
    candidates: dict,
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> dict:
    """
    Section 4.5–4.6: Repeated stratified CV on train only.
    Returns {name: {mean, std, scores}} sorted by ROC-AUC.
    """
    results = {}
    cv = RepeatedStratifiedKFold(
        n_splits=N_CV_FOLDS,
        n_repeats=N_CV_REPEATS,
        random_state=RANDOM_SEED,
    )

    for name, info in candidates.items():
        print(f"    -> CV: {info['label']}...", end=" ", flush=True)
        scores = cross_val_score(
            info["pipeline"], X_train, y_train,
            cv=cv, scoring="roc_auc", n_jobs=-1,
        )
        results[name] = {
            "label": info["label"],
            "mean_auc": round(float(np.mean(scores)), 4),
            "std_auc": round(float(np.std(scores)), 4),
            "scores": [round(float(s), 4) for s in scores],
        }
        print(f"AUC = {results[name]['mean_auc']:.4f} +/- {results[name]['std_auc']:.4f}")

    return dict(sorted(results.items(), key=lambda x: x[1]["mean_auc"], reverse=True))


def bootstrap_confidence_interval(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    metric_fn,
    n_bootstrap: int = N_BOOTSTRAP,
    ci: float = 0.95,
    seed: int = RANDOM_SEED,
) -> dict:
    """
    Section 4.6: Bootstrap 95% CI. State that intervals are wide at ~60 test rows.
    """
    rng = np.random.RandomState(seed)
    scores = []
    n = len(y_true)

    for _ in range(n_bootstrap):
        idx = rng.randint(0, n, n)
        try:
            s = metric_fn(y_true[idx], y_prob[idx])
            scores.append(s)
        except Exception:
            continue

    scores = np.array(scores)
    alpha = (1 - ci) / 2
    return {
        "mean": round(float(np.mean(scores)), 4),
        "ci_lower": round(float(np.percentile(scores, alpha * 100)), 4),
        "ci_upper": round(float(np.percentile(scores, (1 - alpha) * 100)), 4),
        "ci_level": ci,
        "n_bootstrap": n_bootstrap,
        "note": f"Intervals may be wide with only {n} test samples.",
    }


def compute_shap_explanations(
    pipeline: Pipeline,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    feature_names: list[str],
    schema: dict,
) -> dict:
    """
    Section 4.9: SHAP per model.
    Background set is k-means summary of transformed train data.
    Map one-hot back to source feature, group by Demographics/Vitals/Labs/ECG/Echo.
    """
    # Get the preprocessor and classifier
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]

    # Transform train data for background
    X_train_transformed = preprocessor.transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)

    # Get transformed feature names
    try:
        transformed_names = preprocessor.get_feature_names_out()
        transformed_names = [str(n) for n in transformed_names]
    except Exception:
        transformed_names = [f"feature_{i}" for i in range(X_train_transformed.shape[1])]

    # Create background summary
    bg_size = min(SHAP_BACKGROUND_SIZE, X_train_transformed.shape[0])

    # Choose the right explainer
    classifier_type = type(classifier).__name__

    try:
        if classifier_type in ("RandomForestClassifier", "GradientBoostingClassifier"):
            explainer = shap.TreeExplainer(classifier)
            shap_values = explainer.shap_values(X_test_transformed)
            # For binary classification, TreeExplainer may return a list
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # class 1
            if isinstance(explainer.expected_value, (list, np.ndarray)):
                base_value = float(explainer.expected_value[1] if len(explainer.expected_value) > 1 else explainer.expected_value[0])
            else:
                base_value = float(explainer.expected_value)
        elif classifier_type == "LogisticRegression":
            background = shap.kmeans(X_train_transformed, bg_size)
            explainer = shap.LinearExplainer(classifier, background)
            shap_values = explainer.shap_values(X_test_transformed)
            if isinstance(explainer.expected_value, (list, np.ndarray)):
                base_value = float(explainer.expected_value[0])
            else:
                base_value = float(explainer.expected_value)
        else:
            # Model-agnostic fallback
            background = shap.kmeans(X_train_transformed, bg_size)
            explainer = shap.KernelExplainer(
                classifier.predict_proba, background
            )
            shap_values = explainer.shap_values(X_test_transformed, nsamples=100)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            if isinstance(explainer.expected_value, (list, np.ndarray)):
                base_value = float(explainer.expected_value[1] if len(explainer.expected_value) > 1 else explainer.expected_value[0])
            else:
                base_value = float(explainer.expected_value)
    except Exception as e:
        print(f"      [WARN] SHAP failed ({e}), using model-agnostic fallback...")
        background = shap.kmeans(X_train_transformed, bg_size)
        explainer = shap.KernelExplainer(
            classifier.predict_proba, background
        )
        shap_values = explainer.shap_values(X_test_transformed, nsamples=50)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        if isinstance(explainer.expected_value, (list, np.ndarray)):
            base_value = float(explainer.expected_value[1] if len(explainer.expected_value) > 1 else explainer.expected_value[0])
        else:
            base_value = float(explainer.expected_value)

    if hasattr(shap_values, "values"):
        shap_values = shap_values.values
    if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        shap_values = shap_values[:, :, 1]

    # Map one-hot columns back to source features
    source_map = {}
    for i, tname in enumerate(transformed_names):
        # e.g., "cat__VHD_Mild" -> "VHD"
        for orig_col in feature_names:
            if orig_col in tname or tname.endswith(f"__{orig_col}"):
                source_map[i] = orig_col
                break
        if i not in source_map:
            # Try to extract from the transformer prefix
            parts = tname.split("__")
            if len(parts) >= 2:
                source_map[i] = parts[-1].split("_")[0] if "_" in parts[-1] else parts[-1]
            else:
                source_map[i] = tname

    # Build feature group mapping
    feature_groups = schema.get("feature_groups", {})
    col_to_group = {}
    for group_name, cols in feature_groups.items():
        for col in cols:
            col_to_group[col] = group_name

    # Aggregate SHAP by source feature
    feature_shap = {}
    for i in range(shap_values.shape[1]):
        source = source_map.get(i, f"feature_{i}")
        if source not in feature_shap:
            feature_shap[source] = np.zeros(shap_values.shape[0])
        feature_shap[source] += shap_values[:, i]

    # Global mean |SHAP| for each feature
    global_importance = {}
    for feat, vals in feature_shap.items():
        global_importance[feat] = round(float(np.mean(np.abs(vals))), 6)

    # Sort by importance
    sorted_features = sorted(global_importance.items(), key=lambda x: x[1], reverse=True)

    # Top features list
    top_features = []
    for feat, importance in sorted_features[:15]:
        group = col_to_group.get(feat, "Other")
        top_features.append({
            "feature": feat,
            "mean_abs_shap": importance,
            "group": group,
        })

    # Group-level importance
    group_importance = {}
    for feat, importance in global_importance.items():
        group = col_to_group.get(feat, "Other")
        group_importance[group] = group_importance.get(group, 0) + importance

    group_importance = {k: round(v, 6) for k, v in
                        sorted(group_importance.items(), key=lambda x: x[1], reverse=True)}

    return {
        "base_value": round(base_value, 6),
        "explainer_type": type(explainer).__name__,
        "top_features": top_features,
        "global_importance": dict(sorted_features),
        "by_group": group_importance,
        "n_background": bg_size,
        "n_test_samples": int(shap_values.shape[0]),
    }


def train_single_target(
    target: str,
    df: pd.DataFrame,
    train_idx: np.ndarray,
    test_idx: np.ndarray,
    schema: dict,
) -> dict:
    """
    Train a full pipeline for one target. Returns metadata and paths.
    """
    print(f"\n  -- Training: {target.upper()} ----------------------")

    # Build X, y
    X, y = build_xy(df, target, schema)

    # Split
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    print(f"    Train: {len(X_train)} samples, Test: {len(X_test)} samples")
    print(f"    Class balance (train): {dict(y_train.value_counts())}")
    print(f"    Class balance (test):  {dict(y_test.value_counts())}")

    # Flag suspicious features
    flags = flag_suspicious_features(X_train, y_train)
    if flags:
        for f in flags:
            print(f"    [WARN] Suspicious: {f['feature']} ({f['type']} = {f['value']})")

    # Build preprocessor
    preprocessor = build_preprocessor(X_train, schema)

    # Get candidates
    candidates = get_candidates(preprocessor)

    # Evaluate via repeated CV
    cv_results = evaluate_candidates(candidates, X_train, y_train)

    # Pick the winner (best ROC-AUC, excluding dummy)
    non_dummy = {k: v for k, v in cv_results.items() if k != "dummy"}
    winner_name = max(non_dummy, key=lambda k: non_dummy[k]["mean_auc"])
    winner_info = candidates[winner_name]

    print(f"    [OK] Winner: {winner_info['label']} (AUC = {cv_results[winner_name]['mean_auc']:.4f})")

    # Refit winner on all train
    winner_pipeline = winner_info["pipeline"]
    winner_pipeline.fit(X_train, y_train)

    # ── Test set evaluation (done ONCE) ────────────────────────────────
    y_prob = winner_pipeline.predict_proba(X_test)[:, 1]
    y_pred = winner_pipeline.predict(X_test)

    test_auc = roc_auc_score(y_test, y_prob)
    test_ap = average_precision_score(y_test, y_prob)
    test_f1 = f1_score(y_test, y_pred)
    test_acc = accuracy_score(y_test, y_pred)
    test_brier = brier_score_loss(y_test, y_prob)

    print(f"    Test AUC:   {test_auc:.4f}")
    print(f"    Test AP:    {test_ap:.4f}")
    print(f"    Test F1:    {test_f1:.4f}")
    print(f"    Test Brier: {test_brier:.4f}")

    # Bootstrap CIs
    auc_ci = bootstrap_confidence_interval(y_test.values, y_prob, roc_auc_score)
    ap_ci = bootstrap_confidence_interval(y_test.values, y_prob, average_precision_score)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    # ROC curve
    fpr, tpr, roc_thresholds = roc_curve(y_test, y_prob)
    roc_data = {
        "fpr": [round(float(x), 4) for x in fpr],
        "tpr": [round(float(x), 4) for x in tpr],
    }

    # PR curve
    precision_vals, recall_vals, pr_thresholds = precision_recall_curve(y_test, y_prob)
    pr_data = {
        "precision": [round(float(x), 4) for x in precision_vals],
        "recall": [round(float(x), 4) for x in recall_vals],
    }

    # ── Calibration ────────────────────────────────────────────────────
    print(f"    -> Calibrating...")
    calibrated_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", CalibratedClassifierCV(
            winner_pipeline.named_steps["classifier"],
            method="sigmoid",
            cv=5,
        )),
    ])
    calibrated_pipeline.fit(X_train, y_train)

    y_prob_cal = calibrated_pipeline.predict_proba(X_test)[:, 1]
    cal_brier = brier_score_loss(y_test, y_prob_cal)
    print(f"    Calibrated Brier: {cal_brier:.4f}")

    # Reliability curve data
    try:
        prob_true, prob_pred = calibration_curve(y_test, y_prob_cal, n_bins=8)
        reliability = {
            "prob_true": [round(float(x), 4) for x in prob_true],
            "prob_pred": [round(float(x), 4) for x in prob_pred],
        }
    except Exception:
        reliability = {"prob_true": [], "prob_pred": []}

    # ── SHAP ───────────────────────────────────────────────────────────
    print(f"    -> Computing SHAP explanations...")
    shap_data = compute_shap_explanations(
        winner_pipeline, X_train, X_test,
        list(X_train.columns), schema,
    )

    # ── Save artifacts ─────────────────────────────────────────────────
    target_dir = ARTIFACTS_DIR / "v1" / target
    target_dir.mkdir(parents=True, exist_ok=True)

    # Save model
    model_path = target_dir / "model.joblib"
    joblib.dump(calibrated_pipeline, model_path)
    print(f"    [OK] Model saved: {model_path}")

    # Threshold
    threshold = 0.5

    # Metadata
    metadata = {
        "target": target,
        "target_column": TARGETS[target],
        "model_type": winner_info["label"],
        "model_name": winner_name,
        "dataset_hash": schema["dataset"]["sha256"],
        "seed": RANDOM_SEED,
        "library_versions": get_library_versions(),
        "git_sha": get_git_sha(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "threshold": threshold,
        "feature_list": list(X_train.columns),
        "n_features": len(X_train.columns),
        "cv_results": cv_results,
        "test_metrics": {
            "roc_auc": round(test_auc, 4),
            "roc_auc_bootstrap": auc_ci,
            "average_precision": round(test_ap, 4),
            "average_precision_bootstrap": ap_ci,
            "f1": round(test_f1, 4),
            "accuracy": round(test_acc, 4),
            "brier_score": round(test_brier, 4),
            "brier_score_calibrated": round(cal_brier, 4),
            "confusion_matrix": cm,
            "classification_report": report,
        },
        "calibration": {
            "method": "sigmoid",
            "brier_before": round(test_brier, 4),
            "brier_after": round(cal_brier, 4),
            "reliability": reliability,
        },
        "suspicious_features": flags,
        "n_train": len(X_train),
        "n_test": len(X_test),
        "class_balance_train": {str(k): int(v) for k, v in y_train.value_counts().items()},
        "class_balance_test": {str(k): int(v) for k, v in y_test.value_counts().items()},
    }

    meta_path = target_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    # ── Reports ────────────────────────────────────────────────────────
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_data = {
        "target": target,
        "roc_curve": roc_data,
        "pr_curve": pr_data,
        "confusion_matrix": cm,
        "classification_report": report,
        "cv_comparison": cv_results,
        "shap": shap_data,
        "calibration": {
            "reliability": reliability,
            "brier_before": round(test_brier, 4),
            "brier_after": round(cal_brier, 4),
        },
    }

    report_path = REPORTS_DIR / f"{target}.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2, default=str)

    print(f"    [OK] Report saved: {report_path}")

    return metadata


def main():
    """Run the full training pipeline for all four targets."""
    print("=" * 60)
    print("CardioVision 3D — Training Pipeline")
    print("=" * 60)

    # Load schema
    schema = load_schema()
    dataset_info = schema["dataset"]
    print(f"\n  Dataset: {dataset_info['name']}")
    print(f"  SHA-256: {dataset_info['sha256'][:16]}...")
    print(f"  Rows:    {dataset_info['n_rows']}")

    # Load data
    csv_path = DATA_DIR / dataset_info["csv_filename"]
    df = pd.read_csv(csv_path)
    print(f"  Loaded:  {df.shape}")

    # ── Shared stratified split ────────────────────────────────────────
    # Section 4.3: stratified 80/20, fixed seed
    cad_target = df[TARGETS["cad"]]
    train_idx, test_idx = train_test_split(
        np.arange(len(df)),
        test_size=TEST_SIZE,
        stratify=cad_target,
        random_state=RANDOM_SEED,
    )

    split_data = {
        "seed": RANDOM_SEED,
        "test_size": TEST_SIZE,
        "stratify_column": TARGETS["cad"],
        "train_indices": train_idx.tolist(),
        "test_indices": test_idx.tolist(),
        "n_train": len(train_idx),
        "n_test": len(test_idx),
    }
    with open(SPLIT_PATH, "w") as f:
        json.dump(split_data, f, indent=2)
    print(f"  Split saved: {SPLIT_PATH} (train={len(train_idx)}, test={len(test_idx)})")

    # ── Train each target ──────────────────────────────────────────────
    all_metadata = {}
    for target in ["cad", "lad", "lcx", "rca"]:
        meta = train_single_target(target, df, train_idx, test_idx, schema)
        all_metadata[target] = meta

    # ── Summary ────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  TRAINING SUMMARY")
    print("=" * 60)
    for target, meta in all_metadata.items():
        tm = meta["test_metrics"]
        print(f"  {target.upper():4s}  |  AUC={tm['roc_auc']:.3f}  "
              f"F1={tm['f1']:.3f}  Brier={tm['brier_score_calibrated']:.3f}  "
              f"|  {meta['model_type']}")

    print("\n  [OK] All four pipelines trained and saved.")
    print("  [OK] Test set used exactly once per target.")
    print("=" * 60)


if __name__ == "__main__":
    main()
