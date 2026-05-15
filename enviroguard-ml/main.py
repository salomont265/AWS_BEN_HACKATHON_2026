"""
EnviroGuard ML API
FastAPI application serving 3 ML models:
1. YOLOv8-nano litter detector
2. Prophet noise predictor (24h forecast)
3. Prophet fill predictor (48h forecast + overflow)

NOTE: Models must be trained on EC2 before running this server.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from contextlib import asynccontextmanager
from datetime import datetime
import logging
import pickle
import os
from io import BytesIO
from PIL import Image
import time

# Import inference functions
from models.litter.infer import detect_litter, compute_severity
from models.noise.infer_noise import predict_noise
from models.fill.infer_fill import predict_fill

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model storage
models = {}

# ============================================
# Pydantic Models (Request/Response Schemas)
# ============================================

class Detection(BaseModel):
    """Single litter detection."""
    class_name: str = Field(alias='class')
    confidence: float
    bbox: List[float]  # [x, y, w, h]

    class Config:
        populate_by_name = True

class LitterResponse(BaseModel):
    """Litter detection response."""
    severity: int = Field(ge=1, le=5, description="Severity score 1-5")
    detections: List[Detection]
    litter_count: int
    summary: str
    processing_time_ms: float

class HourlyForecast(BaseModel):
    """Single forecast data point."""
    hour: str  # ISO timestamp
    predicted: float
    lower: float
    upper: float

class NoiseForecastResponse(BaseModel):
    """Noise forecast response."""
    station_id: str
    generated_at: str
    forecast: List[HourlyForecast]
    peak_hour: str
    peak_db: float

class FillForecastResponse(BaseModel):
    """Fill forecast response with overflow detection."""
    station_id: str
    generated_at: str
    forecast: List[HourlyForecast]
    overflow_predicted: bool
    overflow_time: Optional[str]
    hours_until_overflow: Optional[int]
    current_fill_pct: float

# ============================================
# Lifespan Context (Model Loading)
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models into memory on startup."""

    logger.info("Loading ML models...")

    models_loaded = 0

    # Load YOLOv8 litter detector
    try:
        from ultralytics import YOLO
        litter_model_path = 'models/litter/best.pt'
        if os.path.exists(litter_model_path):
            models['litter'] = YOLO(litter_model_path)
            logger.info(f"✓ Loaded YOLOv8 litter detector from {litter_model_path}")
            models_loaded += 1
        else:
            logger.warning(f"Litter model not found at {litter_model_path}")
    except Exception as e:
        logger.error(f"Failed to load litter model: {e}")

    # Load noise models (3 stations)
    models['noise'] = {}
    for station_id in ['STATION_001', 'STATION_002', 'STATION_003']:
        try:
            model_path = f'models/noise/{station_id}_model.pkl'
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    models['noise'][station_id] = pickle.load(f)
                logger.info(f"✓ Loaded noise model for {station_id}")
        except Exception as e:
            logger.error(f"Failed to load noise model for {station_id}: {e}")

    if models['noise']:
        models_loaded += 1
        logger.info(f"✓ Loaded {len(models['noise'])} noise prediction models")

    # Load fill models (3 stations)
    models['fill'] = {}
    for station_id in ['STATION_001', 'STATION_002', 'STATION_003']:
        try:
            model_path = f'models/fill/{station_id}_model.pkl'
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    models['fill'][station_id] = pickle.load(f)
                logger.info(f"✓ Loaded fill model for {station_id}")
        except Exception as e:
            logger.error(f"Failed to load fill model for {station_id}: {e}")

    if models['fill']:
        models_loaded += 1
        logger.info(f"✓ Loaded {len(models['fill'])} fill prediction models")

    logger.info(f"✅ Model loading complete: {models_loaded}/3 model types loaded")

    yield

    # Cleanup
    models.clear()
    logger.info("Models unloaded")

# ============================================
# FastAPI App
# ============================================

app = FastAPI(
    title="EnviroGuard ML API",
    version="1.0.0",
    description="Machine learning models for environmental sensing",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Endpoints
# ============================================

@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "EnviroGuard ML API",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "litter_detection": "POST /detect-litter",
            "noise_forecast": "GET /predict-noise/{station_id}",
            "fill_forecast": "GET /predict-fill/{station_id}"
        },
        "docs": "/docs",
        "models_loaded": len([k for k in models.keys() if models[k]])
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    models_loaded = 0
    if 'litter' in models and models['litter']:
        models_loaded += 1
    if 'noise' in models and models['noise']:
        models_loaded += 1
    if 'fill' in models and models['fill']:
        models_loaded += 1

    return {
        "status": "ok",
        "models_loaded": models_loaded,
        "models": {
            "litter": "loaded" if models.get('litter') else "not loaded",
            "noise_stations": list(models.get('noise', {}).keys()),
            "fill_stations": list(models.get('fill', {}).keys())
        }
    }

@app.post("/detect-litter", response_model=LitterResponse)
async def detect_litter_endpoint(file: UploadFile = File(...)):
    """
    Detect litter in uploaded image.

    Args:
        file: Image file (JPEG/PNG)

    Returns:
        LitterResponse with severity, detections, summary
    """
    start_time = time.time()

    # Check if model is loaded
    if 'litter' not in models or not models['litter']:
        raise HTTPException(
            status_code=503,
            detail="Litter detection model not loaded. Train the model first."
        )

    try:
        # Read image file
        contents = await file.read()

        # Convert to PIL Image
        image = Image.open(BytesIO(contents))

        # Run inference using the loaded model
        model = models['litter']
        results = model(image)[0]

        # Parse detections
        detections = []
        for box in results.boxes:
            detections.append({
                'class': results.names[int(box.cls[0])],
                'confidence': float(box.conf[0]),
                'bbox': box.xywh[0].tolist()
            })

        # Compute severity
        severity = compute_severity(detections)

        # Generate summary
        class_counts = {}
        for d in detections:
            class_counts[d['class']] = class_counts.get(d['class'], 0) + 1

        if not class_counts:
            summary = "No litter detected"
        else:
            items = ", ".join(f"{cnt} {cls}" for cls, cnt in class_counts.items())
            summary = f"Detected {len(detections)} items: {items}"

        processing_time = (time.time() - start_time) * 1000

        return LitterResponse(
            severity=severity,
            detections=detections,
            litter_count=len(detections),
            summary=summary,
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        logger.error(f"Litter detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict-noise/{station_id}", response_model=NoiseForecastResponse)
async def predict_noise_endpoint(station_id: str):
    """
    Generate 24-hour noise forecast for a station.

    Args:
        station_id: Station identifier (e.g., 'STATION_001')

    Returns:
        NoiseForecastResponse with 24-hour forecast
    """
    if 'noise' not in models or not models['noise']:
        raise HTTPException(
            status_code=503,
            detail="Noise prediction models not loaded. Train the models first."
        )

    # Use fallback if station not found
    if station_id not in models['noise']:
        logger.warning(f"Station {station_id} not found, using STATION_001")
        station_id = 'STATION_001'

    try:
        result = predict_noise(station_id, hours=24)
        return NoiseForecastResponse(**result)

    except Exception as e:
        logger.error(f"Noise prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict-fill/{station_id}", response_model=FillForecastResponse)
async def predict_fill_endpoint(station_id: str):
    """
    Generate 48-hour fill forecast with overflow detection.

    Args:
        station_id: Station identifier (e.g., 'STATION_001')

    Returns:
        FillForecastResponse with 48-hour forecast and overflow prediction
    """
    if 'fill' not in models or not models['fill']:
        raise HTTPException(
            status_code=503,
            detail="Fill prediction models not loaded. Train the models first."
        )

    # Use fallback if station not found
    if station_id not in models['fill']:
        logger.warning(f"Station {station_id} not found, using STATION_001")
        station_id = 'STATION_001'

    try:
        result = predict_fill(station_id, hours=48)
        return FillForecastResponse(**result)

    except Exception as e:
        logger.error(f"Fill prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Error Handlers
# ============================================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid input", "detail": str(exc)}
    )

@app.exception_handler(FileNotFoundError)
async def file_not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found", "detail": str(exc)}
    )

# ============================================
# Main
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
