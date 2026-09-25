"""
FlowLens AI - Machine Learning Prediction Service
FastAPI application exposing endpoints for:
  - GET /health
  - GET /metrics
  - POST /predict/bottleneck
  - POST /predict/anomaly
  - POST /predict/remaining-time
  - POST /predict/all
  - POST /predict/intervention
"""

import os
import sys
import json
from typing import List, Dict, Any, Optional, Union
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

# Ensure root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from inference.predictor import get_predictor

app = FastAPI(
    title="FlowLens AI - ML Service",
    description="Machine Learning layer for process bottleneck forecasting, anomaly detection, and remaining-time estimation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    caseId: Optional[str] = Field(None, alias="case_id")
    activity: Optional[str] = None
    startTime: Optional[str] = Field(None, alias="start_time")
    endTime: Optional[str] = Field(None, alias="end_time")
    resourceId: Optional[str] = Field(None, alias="resource_id")
    priority: Optional[str] = "NORMAL"
    status: Optional[str] = "completed"
    location: Optional[str] = None


class PredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    events: List[Union[EventItem, Dict[str, Any]]] = Field(default_factory=list)
    activeCaseId: Optional[str] = Field(None, alias="active_case_id")


class InterventionRequest(BaseModel):
    events: List[Union[EventItem, Dict[str, Any]]] = Field(default_factory=list)
    intervention: Dict[str, Any] = Field(default_factory=dict)


def _serialize_events(raw_events: List[Union[EventItem, Dict[str, Any]]]) -> List[Dict[str, Any]]:
    serialized = []
    for ev in raw_events:
        if isinstance(ev, BaseModel):
            serialized.append(ev.model_dump(by_alias=False))
        elif isinstance(ev, dict):
            serialized.append(ev)
    return serialized


@app.get("/health", summary="Health Check")
def health_check():
    predictor = get_predictor()
    models_ready = (
        predictor.forecaster is not None
        and predictor.anomaly_detector is not None
        and predictor.remaining_time_predictor is not None
    )
    return {
        "status": "healthy",
        "service": "FlowLens AI ML Service",
        "modelsLoaded": models_ready,
        "models": {
            "bottleneckForecaster": predictor.forecaster is not None,
            "anomalyDetector": predictor.anomaly_detector is not None,
            "remainingTimePredictor": predictor.remaining_time_predictor is not None,
        },
    }


@app.get("/metrics", summary="Model Evaluation Metrics")
def get_model_metrics():
    report_path = os.path.join(os.path.dirname(__file__), "artifacts", "evaluation_report.json")
    if os.path.exists(report_path):
        try:
            with open(report_path, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"error": f"Failed reading evaluation report: {str(e)}"}
    return {"status": "Metrics report not found in artifacts"}


@app.post("/predict/bottleneck", summary="Bottleneck Forecasting")
def predict_bottleneck(req: PredictionRequest):
    try:
        events = _serialize_events(req.events)
        if not events:
            return {
                "predictedStage": "N/A",
                "probability": 0.0,
                "stageProbabilities": {},
                "confidence": "LOW",
                "topFactors": [],
            }
        predictor = get_predictor()
        return predictor.predict_bottleneck(events)
    except Exception as e:
        return {
            "predictedStage": "N/A",
            "probability": 0.0,
            "stageProbabilities": {},
            "confidence": "LOW",
            "topFactors": [],
            "error": str(e),
        }


@app.post("/predict/anomaly", summary="Case Anomaly Detection")
def predict_anomaly(req: PredictionRequest):
    try:
        events = _serialize_events(req.events)
        if not events:
            return {
                "isAnomaly": False,
                "anomalyScore": 0.0,
                "severity": "LOW",
                "topSignals": ["Empty event dataset"],
                "flaggedCaseCount": 0,
                "totalCaseCount": 0,
                "anomalyRate": 0.0,
                "flaggedCases": [],
            }
        predictor = get_predictor()
        return predictor.predict_anomaly(events)
    except Exception as e:
        return {
            "isAnomaly": False,
            "anomalyScore": 0.0,
            "severity": "LOW",
            "topSignals": [f"Anomaly detection error: {str(e)}"],
            "flaggedCaseCount": 0,
            "totalCaseCount": 0,
            "anomalyRate": 0.0,
            "flaggedCases": [],
        }


@app.post("/predict/remaining-time", summary="Remaining Process Time Estimation")
def predict_remaining_time(req: PredictionRequest):
    try:
        events = _serialize_events(req.events)
        if not events:
            return {
                "predictedRemainingTimeMinutes": 0.0,
                "predictionRange": {"lower": 0.0, "upper": 0.0},
                "formattedPredictedTime": "N/A",
                "formattedRange": "N/A",
                "confidenceLevel": "Unavailable",
            }
        predictor = get_predictor()
        return predictor.predict_remaining_time(events, active_case_id=req.activeCaseId)
    except Exception as e:
        return {
            "predictedRemainingTimeMinutes": 0.0,
            "predictionRange": {"lower": 0.0, "upper": 0.0},
            "formattedPredictedTime": "N/A",
            "formattedRange": "N/A",
            "confidenceLevel": "Unavailable",
            "error": str(e),
        }


@app.post("/predict/all", summary="Unified Process Predictions")
def predict_all(req: PredictionRequest):
    try:
        events = _serialize_events(req.events)
        if not events:
            return {
                "bottleneckForecast": {
                    "predictedStage": "N/A",
                    "probability": 0.0,
                    "stageProbabilities": {},
                    "confidence": "LOW",
                    "topFactors": [],
                },
                "anomalyDetection": {
                    "isAnomaly": False,
                    "anomalyScore": 0.0,
                    "severity": "LOW",
                    "topSignals": ["No event data provided"],
                    "flaggedCaseCount": 0,
                    "totalCaseCount": 0,
                    "anomalyRate": 0.0,
                    "flaggedCases": [],
                },
                "remainingTime": {
                    "predictedRemainingTimeMinutes": 0.0,
                    "predictionRange": {"lower": 0.0, "upper": 0.0},
                    "formattedPredictedTime": "N/A",
                    "formattedRange": "N/A",
                    "confidenceLevel": "Unavailable",
                },
            }
        predictor = get_predictor()
        return predictor.predict_all(events, active_case_id=req.activeCaseId)
    except Exception as e:
        return {
            "bottleneckForecast": {
                "predictedStage": "N/A",
                "probability": 0.0,
                "stageProbabilities": {},
                "confidence": "LOW",
                "topFactors": [],
            },
            "anomalyDetection": {
                "isAnomaly": False,
                "anomalyScore": 0.0,
                "severity": "LOW",
                "topSignals": [f"ML processing exception: {str(e)}"],
                "flaggedCaseCount": 0,
                "totalCaseCount": 0,
                "anomalyRate": 0.0,
                "flaggedCases": [],
            },
            "remainingTime": {
                "predictedRemainingTimeMinutes": 0.0,
                "predictionRange": {"lower": 0.0, "upper": 0.0},
                "formattedPredictedTime": "N/A",
                "formattedRange": "N/A",
                "confidenceLevel": "Unavailable",
            },
            "error": str(e),
        }


@app.post("/predict/intervention", summary="Predict After Intervention (What-If + ML)")
def predict_intervention(req: InterventionRequest):
    try:
        events = _serialize_events(req.events)
        predictor = get_predictor()
        return predictor.predict_after_intervention(events, req.intervention)
    except Exception as e:
        return {
            "beforeBottleneck": "N/A",
            "interventionDescription": "N/A",
            "predictedNextBottleneck": "N/A",
            "probability": 0.0,
            "stageProbabilities": {},
            "confidence": "LOW",
            "migrationDetected": False,
            "narrative": f"Intervention prediction error: {str(e)}",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
