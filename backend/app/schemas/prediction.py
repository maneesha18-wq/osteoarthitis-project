from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProbabilityItem(BaseModel):
    grade: int = Field(..., ge=0, le=4, description="KL Grade (0-4)")
    label: str = Field(..., description="Grade name and severity")
    probability: float = Field(..., ge=0.0, le=1.0, description="Softmax confidence score")

class PreprocessingMetadata(BaseModel):
    resized_to: List[int] = Field(..., description="Dimensions [height, width]")
    clahe_enabled: bool = Field(..., description="Whether CLAHE enhancement was active")
    normalized: bool = Field(..., description="Whether tensor normalization was applied")

class PredictionResponse(BaseModel):
    analysis_id: str = Field(..., description="Unique UUID for this evaluation session")
    status: str = Field("completed", description="Inference execution status")
    predicted_class: int = Field(..., ge=0, le=4, description="Predicted class index (0-4)")
    predicted_grade: str = Field(..., description="Grade designation (e.g., 'Grade 2')")
    severity_label: str = Field(..., description="Clinical severity (e.g., 'Mild')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Winning class probability")
    probabilities: List[ProbabilityItem] = Field(..., description="Complete 5-class distribution")
    model_name: str = Field(..., description="Model architecture")
    model_version: str = Field(..., description="Model checkpoint version")
    timestamp: str = Field(..., description="ISO 8601 evaluation timestamp")
    preprocessing_applied: PreprocessingMetadata = Field(..., description="Preprocessing details")
    inference_time_ms: float = Field(..., description="Execution latency in milliseconds")
    original_image_base64: str = Field(..., description="Base64 encoded original radiograph")
    clahe_image_base64: Optional[str] = Field(None, description="Base64 encoded CLAHE enhanced radiograph")
    gradcam_heatmap_base64: str = Field(..., description="Base64 encoded Grad-CAM heatmap")
    gradcam_overlay_base64: str = Field(..., description="Base64 encoded transparent overlay")
    quad_pipeline_base64: Optional[str] = Field(None, description="Base64 encoded 4-panel interpretability pipeline")
    interpretation_notes: str = Field(..., description="Clinical research advisory note")

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "KneeAI Backend"
    version: str = "1.0.0"

class ReadyResponse(BaseModel):
    status: str
    service: str
    model_ready: bool
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    device: Optional[str] = None
    message: str
