"""
KneeAI FastAPI Application
Main entrypoint providing /health, /ready, and /predict endpoints.
"""

import sys
from pathlib import Path

# Ensure root workspace is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import os
os.environ.setdefault("MPLCONFIGDIR", os.environ.get("TEMP", os.path.expanduser("~")))
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.schemas.prediction import (
    HealthResponse,
    ReadyResponse,
    PredictionResponse
)
from backend.app.services.inference import model_manager

app = FastAPI(
    title="KneeAI Decision Support API",
    description="Explainable Knee Osteoarthritis Grade Classification Using Deep Learning & Grad-CAM",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Check service liveness"
)
async def health_check():
    """Returns basic service health status."""
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION
    )


@app.get(
    "/ready",
    response_model=ReadyResponse,
    tags=["System"],
    summary="Check inference engine readiness"
)
async def readiness_check():
    """
    Returns readiness status, verifying whether a usable deep learning model is loaded.
    """
    if model_manager.is_ready:
        return ReadyResponse(
            status="ready",
            service=settings.PROJECT_NAME,
            model_ready=True,
            model_name=model_manager.model_name,
            model_version=model_manager.model_version,
            device=model_manager.device,
            message="Model loaded and operational for radiograph inference."
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ReadyResponse(
                status="not_ready",
                service=settings.PROJECT_NAME,
                model_ready=False,
                message=f"Model not ready: {model_manager.load_error or 'Initializing weights'}"
            ).dict()
        )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    tags=["Inference"],
    summary="Classify knee radiograph and generate Grad-CAM explanation"
)
async def predict_radiograph(
    file: UploadFile = File(..., description="Knee radiograph image (JPEG, PNG, TIFF)"),
    clahe: bool = Form(True, description="Enable CLAHE contrast enhancement")
):
    """
    Validates uploaded knee radiograph, runs 5-class Kellgren-Lawrence classification,
    and returns full probability distribution and Grad-CAM visual heatmaps.
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded. Please upload a knee radiograph image."
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file stream: {str(e)}"
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if len(file_bytes) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE / (1024*1024):.1f} MB."
        )

    try:
        response = model_manager.run_prediction(file_bytes=file_bytes, apply_clahe=clahe)
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(exc)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
