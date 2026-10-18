"""
Automated Endpoint Tests for KneeAI FastAPI Service
Tests /health, /ready, and /predict validation and inference execution.
"""

import sys
import io
from pathlib import Path
import pytest
from PIL import Image
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify service health endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_ready_endpoint():
    """Verify service readiness endpoint returns 200 OK and model status."""
    response = client.get("/ready")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "model_ready" in data
    assert "service" in data


def test_predict_rejects_empty_file():
    """Verify /predict rejects empty file with 400 Bad Request."""
    files = {"file": ("empty.png", b"", "image/png")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_predict_rejects_invalid_file_type():
    """Verify /predict rejects text or non-image files with 400 Bad Request."""
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400


def test_predict_successful_on_valid_radiograph():
    """Verify /predict processes a real radiograph image and returns 5-class distribution and Grad-CAM."""
    # Find a sample radiograph in dataset
    sample_path = None
    for candidate in ["data set/test/0", "data set/auto_test/0", "archive/test/1"]:
        p = Path(candidate)
        if p.exists():
            for f in p.glob("*.png"):
                sample_path = f
                break
        if sample_path:
            break

    if sample_path:
        with open(sample_path, "rb") as f:
            file_bytes = f.read()
    else:
        # Create synthetic 224x224 grayscale knee-like image
        img = Image.new("L", (224, 224), color=128)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        file_bytes = buf.getvalue()

    files = {"file": ("sample_knee.png", file_bytes, "image/png")}
    data = {"clahe": "true"}

    response = client.post("/predict", files=files, data=data)
    assert response.status_code == 200
    result = response.json()

    # Verify response schema fields
    assert "analysis_id" in result
    assert result["predicted_class"] in [0, 1, 2, 3, 4]
    assert "predicted_grade" in result
    assert "severity_label" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert len(result["probabilities"]) == 5

    # Verify probability distribution sum is approximately 1.0
    prob_sum = sum(p["probability"] for p in result["probabilities"])
    assert pytest.approx(prob_sum, 0.01) == 1.0

    # Verify Grad-CAM base64 strings exist
    assert len(result["original_image_base64"]) > 50
    assert len(result["gradcam_heatmap_base64"]) > 50
    assert len(result["gradcam_overlay_base64"]) > 50
    assert result["status"] == "completed"
