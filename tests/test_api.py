import pytest
from fastapi.testclient import TestClient
from api.app import app

def test_health():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "models_loaded" in data

def test_schema():
    with TestClient(app) as client:
        response = client.get("/api/schema")
        assert response.status_code == 200
        data = response.json()
        assert "features" in data
        assert "n_features" in data
        assert data["n_features"] > 0

def test_predict_validation_error():
    with TestClient(app) as client:
        # Send empty payload, should fail validation
        response = client.post("/api/predict", json={})
        assert response.status_code == 422

def test_predict_success():
    with TestClient(app) as client:
        # Minimum payload
        payload = {
            "Age": 50,
            "Sex": 1,
            "BP": 120,
            "PR": 80,
            "FBS": 90,
            "CR": 0.8,
            "TG": 150,
            "LDL": 100,
            "HDL": 40,
            "HB": 14,
            "K": 4.5,
            "Na": 140,
            "WBC": 6000,
            "EF-TTE": 55
        }
        response = client.post("/api/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert "cad" in data["predictions"]
        assert "lad" in data["predictions"]
        assert "lcx" in data["predictions"]
        assert "rca" in data["predictions"]
        
        # Check explanations
        assert "explanations" in data
        assert "cad" in data["explanations"]
        assert "top" in data["explanations"]["cad"]
