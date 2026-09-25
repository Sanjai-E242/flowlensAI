"""
FlowLens AI - Anomaly Detection Model
Unsupervised IsolationForest identifying anomalous process executions.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

try:
    from features.feature_engineering import CASE_ANOMALY_FEATURE_NAMES
except ImportError:
    from ..features.feature_engineering import CASE_ANOMALY_FEATURE_NAMES


class AnomalyDetector:
    def __init__(self, model: Optional[IsolationForest] = None, contamination: float = 0.12):
        self.model = model or IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=42,
        )
        self.is_trained = model is not None
        self.population_means: Dict[str, float] = {}
        self.population_stds: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame) -> Dict[str, float]:
        """Fit IsolationForest on case feature vectors and record baseline statistics."""
        X_mat = X[CASE_ANOMALY_FEATURE_NAMES].values
        self.model.fit(X_mat)
        self.is_trained = True

        for col in CASE_ANOMALY_FEATURE_NAMES:
            self.population_means[col] = float(X[col].mean())
            std_val = float(X[col].std())
            self.population_stds[col] = std_val if std_val > 0 else 1.0

        return {"n_samples": len(X), "features": len(CASE_ANOMALY_FEATURE_NAMES)}

    def predict_cases(self, case_features_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Evaluate anomalies across case executions.
        Returns:
            isAnomaly: True if primary/target case (or process overall) is anomalous
            anomalyScore: Normalized score 0.0 - 1.0 (higher = more anomalous)
            severity: "LOW" | "MEDIUM" | "HIGH"
            topSignals: Feature-derived operational explanations
            flaggedCases: List of specific flagged outlier cases
        """
        if case_features_df.empty or not self.is_trained:
            return {
                "isAnomaly": False,
                "anomalyScore": 0.0,
                "severity": "LOW",
                "topSignals": ["Insufficient case data"],
                "flaggedCaseCount": 0,
                "totalCaseCount": 0,
                "anomalyRate": 0.0,
                "flaggedCases": [],
            }

        X_mat = case_features_df[CASE_ANOMALY_FEATURE_NAMES].values
        # Decision function: lower values mean more anomalous (negative for outliers)
        raw_scores = self.model.decision_function(X_mat)
        raw_preds = self.model.predict(X_mat)  # -1 for anomaly, 1 for normal

        # Convert raw decision score to calibrated 0.0 - 1.0 anomaly score
        # raw_scores typically range from -0.3 (extreme anomaly) to +0.3 (very normal)
        norm_scores = np.clip(0.5 - (raw_scores * 1.5), 0.0, 1.0)

        flagged_cases = []
        for i, cid in enumerate(case_features_df.index):
            score = float(norm_scores[i])
            is_anom = raw_preds[i] == -1 or score >= 0.65

            if is_anom:
                sev = "HIGH" if score >= 0.80 else ("MEDIUM" if score >= 0.70 else "LOW")
                # Identify signals for this case
                signals = []
                row = case_features_df.iloc[i]
                for f in CASE_ANOMALY_FEATURE_NAMES:
                    mean = self.population_means.get(f, row[f])
                    std = self.population_stds.get(f, 1.0)
                    z = (row[f] - mean) / std
                    if z >= 2.0:
                        signals.append(f"{f.replace('_', ' ').capitalize()} is {z:.1f}σ above normal ({row[f]:.1f})")

                flagged_cases.append({
                    "caseId": str(cid),
                    "anomalyScore": round(score, 3),
                    "severity": sev,
                    "topSignals": signals[:3] if signals else ["Multivariate deviation in process execution pattern"],
                })

        # Overall process evaluation
        flagged_count = len(flagged_cases)
        total_count = len(case_features_df)
        anomaly_rate = flagged_count / total_count if total_count > 0 else 0.0

        # Sort flagged cases by anomaly score descending
        flagged_cases.sort(key=lambda x: x["anomalyScore"], reverse=True)

        # Primary exemplar case (most anomalous or normal representative)
        if flagged_cases:
            exemplar = flagged_cases[0]
            is_anomaly = True
            overall_score = exemplar["anomalyScore"]
            severity = exemplar["severity"]
            top_signals = exemplar["topSignals"]
            target_case_id = exemplar["caseId"]
        else:
            is_anomaly = False
            overall_score = round(float(np.mean(norm_scores)), 3)
            severity = "LOW"
            top_signals = ["All cases operating within normal statistical control thresholds"]
            target_case_id = str(case_features_df.index[0]) if len(case_features_df) > 0 else "N/A"

        return {
            "isAnomaly": is_anomaly,
            "anomalyScore": overall_score,
            "severity": severity,
            "topSignals": top_signals,
            "flaggedCaseCount": flagged_count,
            "totalCaseCount": total_count,
            "anomalyRate": round(anomaly_rate, 3),
            "targetCaseId": target_case_id,
            "flaggedCases": flagged_cases[:10],
        }

    def save(self, filepath: str) -> None:
        save_dict = {
            "model": self.model,
            "means": self.population_means,
            "stds": self.population_stds,
        }
        joblib.dump(save_dict, filepath)

    @classmethod
    def load(cls, filepath: str) -> "AnomalyDetector":
        data = joblib.load(filepath)
        detector = cls(model=data["model"])
        detector.population_means = data.get("means", {})
        detector.population_stds = data.get("stds", {})
        detector.is_trained = True
        return detector
