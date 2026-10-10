# CardioVision 3D — Makefile
# Section 2 of PLAN.md
# Commands: make train, make api, make web, make test, make build

.PHONY: train api web test build clean audit

# ── Python ─────────────────────────────────────────────────────────────
PYTHON ?= python

# ── Audit dataset and produce schema.json ──────────────────────────────
audit:
	$(PYTHON) -m ml.audit_dataset

# ── Train all four pipelines ───────────────────────────────────────────
train: audit
	$(PYTHON) -m ml.train

# ── Run the API server (development) ───────────────────────────────────
api:
	uvicorn api.app:app --reload --port 8000

# ── Run the frontend dev server ────────────────────────────────────────
web:
	cd web && pnpm dev

# ── Run all tests ──────────────────────────────────────────────────────
test:
	$(PYTHON) -m pytest tests/ -v

# ── Leakage gate only ─────────────────────────────────────────────────
test-leakage:
	$(PYTHON) -m pytest tests/test_leakage.py -v

# ── Build for production ──────────────────────────────────────────────
build:
	cd web && pnpm build

# ── Install Python dependencies ────────────────────────────────────────
install:
	pip install -r requirements.txt

# ── Install frontend dependencies ─────────────────────────────────────
install-web:
	cd web && pnpm install

# ── Clean artifacts ────────────────────────────────────────────────────
clean:
	rm -rf artifacts/v1/*/model.joblib
	rm -rf artifacts/reports/*.json
