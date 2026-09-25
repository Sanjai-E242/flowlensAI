"""
FlowLens AI - Unified Process Inference Predictor
Loads models from artifacts and coordinates prediction for:
  - Bottleneck Forecasting
  - Case Anomaly Detection
  - Remaining Time Estimation
  - Predict After Intervention (ML + What-If Synthesis)
"""

import os
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from features.feature_engineering import (
    STAGE_FEATURE_NAMES,
    CASE_ANOMALY_FEATURE_NAMES,
    REMAINING_TIME_FEATURE_NAMES,
    extract_all_features_from_events,
    extract_stage_features,
    parse_events_to_df,
)
from models.bottleneck_forecaster import BottleneckForecaster
from models.anomaly_detector import AnomalyDetector
from models.remaining_time import RemainingTimePredictor

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))


class ProcessPredictor:
    def __init__(self, artifacts_dir: str = ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.forecaster: Optional[BottleneckForecaster] = None
        self.anomaly_detector: Optional[AnomalyDetector] = None
        self.remaining_time_predictor: Optional[RemainingTimePredictor] = None
        self.load_models()

    def load_models(self) -> None:
        bf_path = os.path.join(self.artifacts_dir, "bottleneck_forecaster.joblib")
        if os.path.exists(bf_path):
            try:
                self.forecaster = BottleneckForecaster.load(bf_path)
            except Exception as e:
                print(f"Error loading BottleneckForecaster: {e}")

        ad_path = os.path.join(self.artifacts_dir, "anomaly_detector.joblib")
        if os.path.exists(ad_path):
            try:
                self.anomaly_detector = AnomalyDetector.load(ad_path)
            except Exception as e:
                print(f"Error loading AnomalyDetector: {e}")

        rt_path = os.path.join(self.artifacts_dir, "remaining_time.joblib")
        if os.path.exists(rt_path):
            try:
                self.remaining_time_predictor = RemainingTimePredictor.load(rt_path)
            except Exception as e:
                print(f"Error loading RemainingTimePredictor: {e}")

    def predict_bottleneck(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        extracted = extract_all_features_from_events(events)
        stage_df = extracted["stage_features"]
        if self.forecaster:
            return self.forecaster.predict_bottleneck(stage_df)
        return {
            "predictedStage": "N/A",
            "probability": 0.0,
            "stageProbabilities": {},
            "confidence": "LOW",
            "topFactors": [],
        }

    def predict_anomaly(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        extracted = extract_all_features_from_events(events)
        case_df = extracted["case_anomaly_features"]
        if self.anomaly_detector:
            return self.anomaly_detector.predict_cases(case_df)
        return {
            "isAnomaly": False,
            "anomalyScore": 0.0,
            "severity": "LOW",
            "topSignals": ["Model not loaded"],
            "flaggedCaseCount": 0,
            "totalCaseCount": 0,
            "anomalyRate": 0.0,
            "flaggedCases": [],
        }

    def predict_remaining_time(
        self, events: List[Dict[str, Any]], active_case_id: Optional[str] = None
    ) -> Dict[str, Any]:
        extracted = extract_all_features_from_events(events)
        rem_df = extracted["remaining_time_features"]
        if self.remaining_time_predictor:
            return self.remaining_time_predictor.predict_case(rem_df, active_case_id=active_case_id)
        return {
            "predictedRemainingTimeMinutes": 0.0,
            "predictionRange": {"lower": 0.0, "upper": 0.0},
            "formattedPredictedTime": "N/A",
            "formattedRange": "N/A",
            "confidenceLevel": "Unavailable",
        }

    def predict_all(
        self, events: List[Dict[str, Any]], active_case_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Unified single-pass feature extraction and prediction across all 3 models."""
        extracted = extract_all_features_from_events(events)
        stage_df = extracted["stage_features"]
        case_df = extracted["case_anomaly_features"]
        rem_df = extracted["remaining_time_features"]

        if self.forecaster:
            bottleneck_res = self.forecaster.predict_bottleneck(stage_df)
        else:
            bottleneck_res = {
                "predictedStage": "N/A",
                "probability": 0.0,
                "stageProbabilities": {},
                "confidence": "LOW",
                "topFactors": [],
            }

        if self.anomaly_detector:
            anomaly_res = self.anomaly_detector.predict_cases(case_df)
        else:
            anomaly_res = {
                "isAnomaly": False,
                "anomalyScore": 0.0,
                "severity": "LOW",
                "topSignals": ["Anomaly detector model unavailable"],
                "flaggedCaseCount": 0,
                "totalCaseCount": len(case_df),
                "anomalyRate": 0.0,
                "flaggedCases": [],
            }

        if self.remaining_time_predictor:
            # If target case ID was provided or flagged anomalous case exists, use it
            target_cid = active_case_id or anomaly_res.get("targetCaseId")
            rem_res = self.remaining_time_predictor.predict_case(rem_df, target_case_id=target_cid)
        else:
            rem_res = {
                "predictedRemainingTimeMinutes": 0.0,
                "predictionRange": {"lower": 0.0, "upper": 0.0},
                "formattedPredictedTime": "N/A",
                "formattedRange": "N/A",
                "confidenceLevel": "Unavailable",
            }

        return {
            "bottleneckForecast": bottleneck_res,
            "anomalyDetection": anomaly_res,
            "remainingTime": rem_res,
            "datasetContext": {
                "totalCases": len(case_df),
                "totalStages": len(stage_df),
                "stages": list(stage_df.index),
            },
        }

    def predict_after_intervention(
        self,
        events: List[Dict[str, Any]],
        intervention: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Phase 15: ML + What-If Synthesis
        Synthesizes the deterministic simulation intervention (e.g. +2 resources on Verification)
        with ML bottleneck forecasting to predict the next bottleneck AFTER intervention.
        """
        extracted = extract_all_features_from_events(events)
        stage_df = extracted["stage_features"].copy()

        if stage_df.empty or not self.forecaster:
            return {
                "beforeBottleneck": "N/A",
                "interventionDescription": "N/A",
                "predictedNextBottleneck": "N/A",
                "probability": 0.0,
                "stageProbabilities": {},
                "confidence": "LOW",
                "migrationDetected": False,
                "narrative": "Predictive model unavailable for intervention modeling.",
            }

        # Baseline prediction
        baseline_pred = self.forecaster.predict_bottleneck(stage_df)
        before_stage = baseline_pred.get("predictedStage", "N/A")

        target_stage = intervention.get("targetStage") or before_stage
        added_resources = int(intervention.get("addedResources", 2))
        proc_reduction_pct = float(intervention.get("processingReductionPct", 0.0))
        wait_reduction_pct = float(intervention.get("waitingReductionPct", 45.0))

        # Apply deterministic intervention adjustments to target stage features
        if target_stage in stage_df.index:
            row = stage_df.loc[target_stage].copy()
            # Resource addition reduces queue wait and increases resource capacity
            orig_wait_mean = row["stage_waiting_mean"]
            new_wait_mean = max(2.0, orig_wait_mean * (1.0 - wait_reduction_pct / 100.0))
            row["stage_waiting_mean"] = new_wait_mean
            row["waiting_time"] = row["waiting_time"] * (1.0 - wait_reduction_pct / 100.0)
            row["waiting_contribution"] = max(2.0, row["waiting_contribution"] * 0.4)
            row["queue_length"] = max(0.1, row["queue_length"] / (1.0 + added_resources * 0.5))
            row["resource_load"] = max(1.0, row["resource_load"] / (1.0 + added_resources * 0.5))
            if proc_reduction_pct > 0:
                row["stage_processing_mean"] = max(2.0, row["stage_processing_mean"] * (1.0 - proc_reduction_pct / 100.0))
                row["processing_contribution"] = max(2.0, row["processing_contribution"] * (1.0 - proc_reduction_pct / 100.0))

            stage_df.loc[target_stage] = row

            # Re-normalize contributions
            tot_wait = stage_df["waiting_time"].sum()
            if tot_wait > 0:
                stage_df["waiting_contribution"] = (stage_df["waiting_time"] / tot_wait) * 100.0

        # Predict with adjusted state
        after_pred = self.forecaster.predict_bottleneck(stage_df)
        predicted_after_stage = after_pred.get("predictedStage")
        after_prob = after_pred.get("probability", 0.0)
        migration_detected = predicted_after_stage != target_stage

        interv_desc = f"+{added_resources} resources allocated to {target_stage}"
        if proc_reduction_pct > 0:
            interv_desc += f" with {proc_reduction_pct:.0f}% cycle reduction"

        if migration_detected:
            narrative = (
                f"With {interv_desc}, queuing at {target_stage} drops significantly. "
                f"The predictive model forecasts the operational bottleneck will migrate downstream to "
                f"{predicted_after_stage} with {after_prob * 100:.0f}% probability."
            )
        else:
            narrative = (
                f"Even with {interv_desc}, {target_stage} remains the primary predicted constraint "
                f"({after_prob * 100:.0f}% probability), suggesting additional structural capacity or rework remediation is required."
            )

        return {
            "beforeBottleneck": before_stage,
            "targetStage": target_stage,
            "interventionDescription": interv_desc,
            "predictedNextBottleneck": predicted_after_stage,
            "probability": after_prob,
            "stageProbabilities": after_pred.get("stageProbabilities", {}),
            "confidence": after_pred.get("confidence", "MEDIUM"),
            "topFactors": after_pred.get("topFactors", []),
            "migrationDetected": migration_detected,
            "narrative": narrative,
        }


_global_predictor: Optional[ProcessPredictor] = None


def get_predictor() -> ProcessPredictor:
    global _global_predictor
    if _global_predictor is None:
        _global_predictor = ProcessPredictor()
    return _global_predictor
