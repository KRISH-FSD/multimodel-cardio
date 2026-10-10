"""
features.py — Leakage firewall + feature builder.
Section 4.2 of PLAN.md.

The FORBIDDEN set {LAD, LCX, RCA, Cath} never enters any feature matrix.
build_xy() returns X and y separately, asserting the intersection is empty.
"""

import json
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schema.json"

# ── HARD RULE: these columns are NEVER model inputs ───────────────────
FORBIDDEN = frozenset({"LAD", "LCX", "RCA", "Cath"})

# ── Target mapping ────────────────────────────────────────────────────
TARGETS = {
    "cad": "Cath",
    "lad": "LAD",
    "lcx": "LCX",
    "rca": "RCA",
}


def load_schema() -> dict:
    """Load the audited schema."""
    with open(SCHEMA_PATH) as f:
        return json.load(f)


def get_feature_allowlist(schema: dict) -> list[str]:
    """
    Return the ordered list of allowed feature columns.
    This is everything in the schema's feature_allowlist,
    minus any FORBIDDEN columns (defense in depth).
    """
    allowlist = [col for col in schema["feature_allowlist"] if col not in FORBIDDEN]
    return allowlist


def build_xy(
    df: pd.DataFrame,
    target: str,
    schema: dict | None = None,
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Build feature matrix X and target vector y for a given task.

    Args:
        df: Full dataset DataFrame
        target: One of 'cad', 'lad', 'lcx', 'rca'
        schema: Optional pre-loaded schema dict

    Returns:
        (X, y) where X has no FORBIDDEN columns

    Raises:
        ValueError: If target is invalid
        AssertionError: If any FORBIDDEN column leaks into X
    """
    if target not in TARGETS:
        raise ValueError(f"Unknown target '{target}'. Must be one of {list(TARGETS.keys())}")

    if schema is None:
        schema = load_schema()

    target_col = TARGETS[target]

    # Get y
    y = df[target_col].copy()

    # Ensure binary
    unique_vals = sorted(y.dropna().unique())
    if len(unique_vals) != 2:
        raise ValueError(
            f"Target '{target}' ({target_col}) is not binary. "
            f"Unique values: {unique_vals}"
        )

    # Get X from allowlist only
    feature_cols = get_feature_allowlist(schema)
    available_cols = [col for col in feature_cols if col in df.columns]
    X = df[available_cols].copy()

    # ── LEAKAGE FIREWALL ──────────────────────────────────────────────
    leaked = set(X.columns) & FORBIDDEN
    assert len(leaked) == 0, (
        f"LEAKAGE DETECTED: {leaked} found in feature matrix for target '{target}'. "
        f"These columns are FORBIDDEN and must never be model inputs."
    )

    # Also check the target column is not in X
    assert target_col not in X.columns, (
        f"LEAKAGE DETECTED: target column '{target_col}' found in X"
    )

    return X, y


def flag_suspicious_features(
    X: pd.DataFrame,
    y: pd.Series,
    auc_threshold: float = 0.95,
    corr_threshold: float = 0.95,
) -> list[dict]:
    """
    Flag features with suspiciously high predictive power (possible leakage).
    Section 4.2: flag any single feature with ROC-AUC > 0.95 or correlation > 0.95.
    """
    from sklearn.metrics import roc_auc_score

    flags = []
    for col in X.select_dtypes(include=[np.number]).columns:
        valid = X[col].notna() & y.notna()
        if valid.sum() < 10:
            continue

        # Correlation
        corr = abs(X.loc[valid, col].corr(y[valid]))
        if corr > corr_threshold:
            flags.append({
                "feature": col,
                "type": "correlation",
                "value": round(corr, 4),
                "threshold": corr_threshold,
            })

        # Single-feature AUC
        try:
            auc = roc_auc_score(y[valid], X.loc[valid, col])
            auc = max(auc, 1 - auc)  # Handle inverted features
            if auc > auc_threshold:
                flags.append({
                    "feature": col,
                    "type": "roc_auc",
                    "value": round(auc, 4),
                    "threshold": auc_threshold,
                })
        except Exception:
            pass

    return flags
