"""
FlowLens AI - ML Service Automated Tests
Verifies:
  1. Feature extraction
  2. Training data generation
  3. Bottleneck classifier
  4. Anomaly detector
  5. Remaining-time model
  6. API validation
  7. Malformed input handling
  8. Empty dataset resilience
  9. Missing optional fields
  10. Predict after intervention
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app
from features.feature_engineering import (
    STAGE_FEATURE_NAMES,
    CASE_ANOMALY_FEATURE_NAMES,
    REMAINING_TIME_FEATURE_NAMES,
    extract_all_features_from_events,
    extract_stage_features,
    parse_events_to_df,
)
from training.generate_training_data import generate_pattern_cases
from inference.predictor import get_predictor
from datetime import datetime

client = TestClient(app)


@pytest.fixture
def sample_events():
    events, _ = generate_pattern_cases(
        pattern="WAITING_BOTTLENECK",
        num_cases=15,
        start_case_num=1,
        base_timestamp=datetime(2026, 8, 1, 8, 0, 0),
    )
    return events


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["modelsLoaded"] is True


def test_metrics_endpoint():
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "bottleneck_forecaster" in data["models"]
    assert "anomaly_detector" in data["models"]
    assert "remaining_time_predictor" in data["models"]


def test_feature_extraction(sample_events):
    extracted = extract_all_features_from_events(sample_events)
    stage_df = extracted["stage_features"]
    case_df = extracted["case_anomaly_features"]
    rem_df = extracted["remaining_time_features"]

    assert not stage_df.empty
    assert list(stage_df.columns) == STAGE_FEATURE_NAMES
    assert not case_df.empty
    assert list(case_df.columns) == CASE_ANOMALY_FEATURE_NAMES
    assert not rem_df.empty
    assert list(rem_df.columns) == REMAINING_TIME_FEATURE_NAMES


def test_empty_dataset_handling():
    res = client.post("/predict/all", json={"events": []})
    assert res.status_code == 200
    data = res.json()
    assert data["bottleneckForecast"]["predictedStage"] == "N/A"
    assert data["anomalyDetection"]["isAnomaly"] is False
    assert data["remainingTime"]["predictedRemainingTimeMinutes"] == 0.0


def test_malformed_input_handling():
    # Events with corrupt timestamps or missing keys
    malformed_events = [
        {"case_id": "C01", "activity": "Stage1", "start_time": "invalid_date", "end_time": "none"},
        {"foo": "bar", "unknown": 123},
        {"case_id": "C02", "activity": "Stage2"},
    ]
    res = client.post("/predict/all", json={"events": malformed_events})
    assert res.status_code == 200
    data = res.json()
    assert "bottleneckForecast" in data
    assert "anomalyDetection" in data
    assert "remainingTime" in data


def test_missing_optional_fields():
    # Only minimal keys provided (no priority, no location, no status, no resource)
    minimal_events = [
        {"caseId": "C1", "activity": "StepA", "startTime": "2026-08-01 09:00:00", "endTime": "2026-08-01 09:30:00"},
        {"caseId": "C1", "activity": "StepB", "startTime": "2026-08-01 10:00:00", "endTime": "2026-08-01 10:45:00"},
        {"caseId": "C2", "activity": "StepA", "startTime": "2026-08-01 09:15:00", "endTime": "2026-08-01 09:40:00"},
        {"caseId": "C2", "activity": "StepB", "startTime": "2026-08-01 11:00:00", "endTime": "2026-08-01 11:50:00"},
    ]
    res = client.post("/predict/all", json={"events": minimal_events})
    assert res.status_code == 200
    data = res.json()
    assert data["bottleneckForecast"]["predictedStage"] in ["StepA", "StepB"]
    assert 0.0 <= data["bottleneckForecast"]["probability"] <= 1.0


def test_bottleneck_forecaster_endpoint(sample_events):
    res = client.post("/predict/bottleneck", json={"events": sample_events})
    assert res.status_code == 200
    data = res.json()
    assert "predictedStage" in data
    assert data["predictedStage"] in ["Intake", "Verification", "Review", "Approval", "Fulfillment"]
    assert 0.0 <= data["probability"] <= 1.0
    assert len(data["topFactors"]) > 0
    assert data["confidence"] in ["HIGH", "MEDIUM", "LOW"]


def test_anomaly_detector_endpoint(sample_events):
    res = client.post("/predict/anomaly", json={"events": sample_events})
    assert res.status_code == 200
    data = res.json()
    assert "isAnomaly" in data
    assert "anomalyScore" in data
    assert data["severity"] in ["LOW", "MEDIUM", "HIGH"]
    assert "topSignals" in data
    assert isinstance(data["flaggedCases"], list)


def test_remaining_time_endpoint(sample_events):
    res = client.post("/predict/remaining-time", json={"events": sample_events})
    assert res.status_code == 200
    data = res.json()
    assert "predictedRemainingTimeMinutes" in data
    assert data["predictedRemainingTimeMinutes"] >= 0.0
    assert "predictionRange" in data
    assert data["predictionRange"]["lower"] <= data["predictionRange"]["upper"]


def test_predict_after_intervention(sample_events):
    intervention_payload = {
        "events": sample_events,
        "intervention": {
            "targetStage": "Verification",
            "addedResources": 2,
            "waitingReductionPct": 50.0,
        },
    }
    res = client.post("/predict/intervention", json=intervention_payload)
    assert res.status_code == 200
    data = res.json()
    assert "beforeBottleneck" in data
    assert "predictedNextBottleneck" in data
    assert "probability" in data
    assert "migrationDetected" in data
    assert "narrative" in data
