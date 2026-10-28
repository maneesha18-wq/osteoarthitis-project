"""
Automated Test Runner for KneeAI Backend
Uses Python's standard library unittest to verify API endpoints,
preprocessing, model loading, and Grad-CAM generation.
"""

import os
import sys
import io
import json
import unittest
from pathlib import Path
from PIL import Image

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

os.environ.setdefault("MPLCONFIGDIR", os.environ.get("TEMP", os.path.expanduser("~")))
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.inference import model_manager

class TestKneeAIBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        """Test GET /health returns 200 and healthy status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("service", data)

    def test_02_ready_check(self):
        """Test GET /ready verifies model readiness."""
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["model_ready"])
        self.assertEqual(data["status"], "ready")

    def test_03_predict_rejects_empty_file(self):
        """Test POST /predict rejects empty file."""
        files = {"file": ("empty.png", b"", "image/png")}
        response = self.client.post("/predict", files=files)
        self.assertEqual(response.status_code, 400)

    def test_04_predict_rejects_invalid_file(self):
        """Test POST /predict rejects non-image text file."""
        files = {"file": ("notes.txt", b"Invalid content", "text/plain")}
        response = self.client.post("/predict", files=files)
        self.assertEqual(response.status_code, 400)

    def test_05_predict_real_radiograph(self):
        """Test POST /predict with a real knee radiograph image."""
        # Find sample radiograph in dataset
        sample_path = None
        for candidate in [
            "Digital Knee X-ray Images/Digital Knee X-ray Images/Knee X-ray Images/MedicalExpert-I/MedicalExpert-I/0Normal",
            "data set/test/0",
            "archive/test/1"
        ]:
            p = ROOT_DIR / candidate
            if p.exists():
                for f in p.iterdir():
                    if f.suffix.lower() == ".png":
                        sample_path = f
                        break
            if sample_path:
                break

        if sample_path:
            with open(sample_path, "rb") as f:
                file_bytes = f.read()
        else:
            img = Image.new("L", (224, 224), color=128)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            file_bytes = buf.getvalue()

        files = {"file": ("sample_knee.png", file_bytes, "image/png")}
        data = {"clahe": "true"}

        response = self.client.post("/predict", files=files, data=data)
        self.assertEqual(response.status_code, 200)
        result = response.json()

        # Validate schema
        self.assertIn("analysis_id", result)
        self.assertIn(result["predicted_class"], [0, 1, 2, 3, 4])
        self.assertIn("predicted_grade", result)
        self.assertIn("severity_label", result)
        self.assertTrue(0.0 <= result["confidence"] <= 1.0)
        self.assertEqual(len(result["probabilities"]), 5)

        # Validate probability sum
        prob_sum = sum(p["probability"] for p in result["probabilities"])
        self.assertAlmostEqual(prob_sum, 1.0, places=2)

        # Validate Grad-CAM base64 images
        self.assertTrue(len(result["original_image_base64"]) > 100)
        self.assertTrue(len(result["gradcam_heatmap_base64"]) > 100)
        self.assertTrue(len(result["gradcam_overlay_base64"]) > 100)
        self.assertTrue(len(result.get("clahe_image_base64", "")) > 100)
        self.assertTrue(len(result.get("quad_pipeline_base64", "")) > 100)
        self.assertEqual(result["status"], "completed")

if __name__ == "__main__":
    unittest.main()
