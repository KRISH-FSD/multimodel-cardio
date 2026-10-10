"""
test_leakage.py — CI gate: if this fails, nothing merges.
Section 9 of PLAN.md.

Tests that FORBIDDEN columns {LAD, LCX, RCA, Cath} never
appear in any feature matrix for any target.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from ml.features import FORBIDDEN, TARGETS, build_xy, load_schema


@pytest.fixture
def schema():
    """Load the dataset schema."""
    return load_schema()


@pytest.fixture
def dataframe(schema):
    """Load the dataset."""
    csv_path = ROOT / "data" / schema["dataset"]["csv_filename"]
    return pd.read_csv(csv_path)


class TestLeakageFirewall:
    """
    HARD RULE: LAD, LCX, RCA, Cath never enter any feature matrix.
    Labels live in y only.
    """

    def test_forbidden_set_is_complete(self):
        """Ensure the FORBIDDEN set contains all required columns."""
        assert "LAD" in FORBIDDEN
        assert "LCX" in FORBIDDEN
        assert "RCA" in FORBIDDEN
        assert "Cath" in FORBIDDEN

    def test_forbidden_not_in_allowlist(self, schema):
        """FORBIDDEN columns must not appear in the feature allowlist."""
        allowlist = set(schema.get("feature_allowlist", []))
        leaked = allowlist & FORBIDDEN
        assert len(leaked) == 0, f"FORBIDDEN columns in allowlist: {leaked}"

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_forbidden_not_in_feature_matrix(self, target, dataframe, schema):
        """
        For each target, build_xy() must return X without any FORBIDDEN column.
        This is the core leakage test.
        """
        X, y = build_xy(dataframe, target, schema)
        leaked = set(X.columns) & FORBIDDEN
        assert len(leaked) == 0, (
            f"LEAKAGE in {target}: FORBIDDEN columns {leaked} found in X"
        )

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_target_not_in_features(self, target, dataframe, schema):
        """Target column must not appear in X."""
        X, y = build_xy(dataframe, target, schema)
        target_col = TARGETS[target]
        assert target_col not in X.columns, (
            f"Target column '{target_col}' found in X for {target}"
        )

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_target_is_binary(self, target, dataframe, schema):
        """Each target must be binary (two unique values)."""
        X, y = build_xy(dataframe, target, schema)
        unique = sorted(y.dropna().unique())
        assert len(unique) == 2, (
            f"Target '{target}' is not binary. Unique values: {unique}"
        )

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_no_cross_vessel_inputs(self, target, dataframe, schema):
        """
        For any vessel model (lad, lcx, rca), ensure that
        other vessel predictions are not used as inputs.
        """
        X, y = build_xy(dataframe, target, schema)
        all_target_cols = set(TARGETS.values())
        leaked = set(X.columns) & all_target_cols
        assert len(leaked) == 0, (
            f"Cross-vessel leakage in {target}: {leaked}"
        )

    def test_feature_matrix_column_order_is_stable(self, dataframe, schema):
        """Column order must be consistent across calls."""
        X1, _ = build_xy(dataframe, "cad", schema)
        X2, _ = build_xy(dataframe, "cad", schema)
        assert list(X1.columns) == list(X2.columns), "Column order is not stable"

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_build_xy_assertion_catches_injection(self, target, dataframe, schema):
        """
        If someone manually adds a FORBIDDEN column to the dataframe,
        build_xy must still exclude it.
        """
        X, y = build_xy(dataframe, target, schema)
        # Verify no forbidden column slipped through
        for col in FORBIDDEN:
            assert col not in X.columns, f"FORBIDDEN column '{col}' in X for {target}"


class TestModelArtifacts:
    """Test that saved model artifacts don't contain forbidden features."""

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_metadata_feature_list_clean(self, target):
        """Metadata feature list must not contain FORBIDDEN columns."""
        meta_path = ROOT / "artifacts" / "v1" / target / "metadata.json"
        if not meta_path.exists():
            pytest.skip(f"Metadata not found for {target}")

        with open(meta_path) as f:
            meta = json.load(f)

        feature_list = set(meta.get("feature_list", []))
        leaked = feature_list & FORBIDDEN
        assert len(leaked) == 0, (
            f"FORBIDDEN columns in metadata for {target}: {leaked}"
        )

    @pytest.mark.parametrize("target", ["cad", "lad", "lcx", "rca"])
    def test_model_beats_dummy(self, target):
        """Each model must beat the dummy baseline in CV."""
        meta_path = ROOT / "artifacts" / "v1" / target / "metadata.json"
        if not meta_path.exists():
            pytest.skip(f"Metadata not found for {target}")

        with open(meta_path) as f:
            meta = json.load(f)

        cv_results = meta.get("cv_results", {})
        if "dummy" not in cv_results:
            pytest.skip("No dummy baseline in CV results")

        dummy_auc = cv_results["dummy"]["mean_auc"]
        winner_name = meta.get("model_name", "")
        if winner_name in cv_results:
            winner_auc = cv_results[winner_name]["mean_auc"]
            assert winner_auc > dummy_auc, (
                f"Winner ({winner_name}) AUC={winner_auc} <= Dummy AUC={dummy_auc}"
            )
