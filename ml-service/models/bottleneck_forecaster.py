"""
FlowLens AI - Bottleneck Forecasting Model
Supervised RandomForestClassifier predicting which stage becomes the dominant bottleneck.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

try:
    from features.feature_engineering import STAGE_FEATURE_NAMES
except ImportError:
    from ..features.feature_engineering import STAGE_FEATURE_NAMES


class BottleneckForecaster:
    def __init__(self, model: Optional[RandomForestClassifier] = None):
        self.model = model or RandomForestClassifier(
            n_estimators=120,
            max_depth=10,
            min_samples_split=5,
            class_weight="balanced",
            random_state=42,
        )
        self.is_trained = model is not None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """Fit the classifier on stage feature vectors and binary bottleneck labels."""
        X_mat = X[STAGE_FEATURE_NAMES].values
        y_vec = y.values
        self.model.fit(X_mat, y_vec)
        self.is_trained = True

        train_acc = float(self.model.score(X_mat, y_vec))
        return {"train_accuracy": train_acc}

    def predict_bottleneck(self, stage_features_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Evaluate bottleneck probabilities for all stages in an operating window.
        Returns:
            predictedStage: Stage name with highest probability
            probability: Calibrated probability
            stageProbabilities: Dict mapping each stage to its probability
            confidence: "HIGH" | "MEDIUM" | "LOW"
            topFactors: List of top contributing feature signals with importance
        """
        if stage_features_df.empty or not self.is_trained:
            return {
                "predictedStage": "N/A",
                "probability": 0.0,
                "stageProbabilities": {},
                "confidence": "LOW",
                "topFactors": [],
            }

        stages = list(stage_features_df.index)
        X_mat = stage_features_df[STAGE_FEATURE_NAMES].values

        # Predict raw probabilities for class 1 (bottleneck)
        raw_probs = self.model.predict_proba(X_mat)
        if raw_probs.shape[1] > 1:
            stage_scores = raw_probs[:, 1]
        else:
            stage_scores = raw_probs[:, 0]

        # Softmax / Normalize across stages so they sum to 1.0
        exp_scores = np.exp(stage_scores * 3.0)  # Temperature scaling for discriminative spread
        sum_exp = np.sum(exp_scores)
        normalized_probs = exp_scores / (sum_exp if sum_exp > 0 else 1.0)

        best_idx = int(np.argmax(normalized_probs))
        predicted_stage = stages[best_idx]
        best_prob = float(normalized_probs[best_idx])

        # Stage probabilities dictionary
        stage_prob_dict = {
            s: round(float(normalized_probs[i]), 3) for i, s in enumerate(stages)
        }

        # Confidence level
        if best_prob >= 0.65:
            confidence = "HIGH"
        elif best_prob >= 0.40:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        # Model feature importance & Top Factors
        importances = self.model.feature_importances_
        best_stage_features = stage_features_df.iloc[best_idx]

        factor_impacts = []
        human_labels = {
            "waiting_contribution": "Waiting delay contribution",
            "processing_contribution": "Processing duration contribution",
            "resource_load": "Resource workload concentration",
            "queue_length": "Queue accumulation backlog",
            "peak_hour_load": "Peak-period surge volume",
            "stage_processing_mean": "Execution duration mean",
            "stage_waiting_mean": "Queue waiting time mean",
            "stage_processing_std": "Process duration variability",
            "process_efficiency": "Stage process efficiency ratio",
            "upstream_delay": "Upstream transfer delay",
            "downstream_delay": "Downstream bottleneck backpressure",
            "rework_frequency": "Stage rework & revisit rate",
        }

        for fname, imp in zip(STAGE_FEATURE_NAMES, importances):
            val = best_stage_features.get(fname, 0.0)
            factor_impacts.append({
                "factor": fname,
                "label": human_labels.get(fname, fname.replace("_", " ").title()),
                "importance": round(float(imp), 4),
                "value": round(float(val), 2),
            })

        # Sort by model feature importance
        factor_impacts.sort(key=lambda x: x["importance"], reverse=True)
        top_factors = factor_impacts[:5]

        return {
            "predictedStage": predicted_stage,
            "probability": round(best_prob, 3),
            "stageProbabilities": stage_prob_dict,
            "confidence": confidence,
            "topFactors": top_factors,
        }

    def save(self, filepath: str) -> None:
        joblib.dump(self.model, filepath)

    @classmethod
    def load(cls, filepath: str) -> "BottleneckForecaster":
        loaded_model = joblib.load(filepath)
        return cls(model=loaded_model)
