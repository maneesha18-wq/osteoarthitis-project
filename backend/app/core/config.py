import os
from pathlib import Path
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "KneeAI Decision Support API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Model configuration
    MODEL_DIR: str = os.getenv("MODEL_DIR", "ml/artifacts")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ml/artifacts/mobilenetv2_knee_kl.keras")
    MODEL_NAME: str = "MobileNetV2 Knee KL Classifier"
    MODEL_VERSION: str = "1.0.0"
    DEVICE: str = "CPU"
    
    # Upload limits: 10MB
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 10 * 1024 * 1024))
    
    # Radiograph dimensions
    TARGET_IMAGE_SIZE: tuple = (224, 224)

settings = Settings()
