"""
FlowLens AI - Remaining Time Prediction Model
RandomForestRegressor estimating remaining cycle time for active / in-flight cases.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

try:
    from features.feature_engineering import REMAINING_TIME_FEATURE_NAMES
except ImportError:
    from ..features.feature_engineering import REMAINING_TIME_FEATURE_NAMES


def format_minutes_duration(minutes: float) -> str:
    """Format minutes to human-readable 'Xh Ym' or 'Ym'."""
    mins = max(0.0, float(minutes))
    hrs = int(mins // 60)
    rem_mins = int(round(mins % 60))
    if hrs > 0:
        return f"{hrs}h {rem_mins}m"
    return f"{rem_mins}m"


class RemainingTimePredictor:
    def __init__(self, model: Optional[RandomForestRegressor] = None):
        self.model = model or RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            min_samples_split=4,
            random_state=42,
        )
        self.is_trained = model is not None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """Fit regressor on remaining time features and ground-truth remaining minutes."""
        X_mat = X[REMAINING_TIME_FEATURE_NAMES].values
        y_vec = y.values
        self.model.fit(X_mat, y_vec)
        self.is_trained = True

        r2 = float(self.model.score(X_mat, y_vec))
        return {"r2_score": r2}

    def predict_case(self, remaining_features_df: pd.DataFrame, target_case_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Predict remaining time and confidence bounds for target or latest case.
        Returns:
            predictedRemainingTimeMinutes: float
            predictionRange: { "lower": float, "upper": float }
            formattedPredictedTime: "2h 18m"
            formattedRange: "1h 52m — 2h 47m"
        """
        if remaining_features_df.empty or not self.is_trained:
            return {
                "predictedRemainingTimeMinutes": 0.0,
                "predictionRange": {"lower": 0.0, "upper": 0.0},
                "formattedPredictedTime": "N/A",
                "formattedRange": "N/A",
                "confidenceLevel": "Unavailable",
                "targetCaseId": target_case_id or "N/A",
            }

        if target_case_id and target_case_id in remaining_features_df.index:
            row = remaining_features_df.loc[[target_case_id]]
            cid = target_case_id
        else:
            # Pick first available or exemplar case
            row = remaining_features_df.iloc[[0]]
            cid = str(remaining_features_df.index[0])

        X_mat = row[REMAINING_TIME_FEATURE_NAMES].values

        # Ensemble point prediction
        pred_mean = float(self.model.predict(X_mat)[0])
        pred_mean = max(5.0, pred_mean)

        # Quantile interval from ensemble estimators
        tree_preds = [float(est.predict(X_mat)[0]) for est in self.model.estimators_]
        lower_bound = max(0.0, float(np.percentile(tree_preds, 10)))
        upper_bound = max(pred_mean, float(np.percentile(tree_preds, 90)))

        return {
            "predictedRemainingTimeMinutes": round(pred_mean, 1),
            "predictionRange": {
                "lower": round(lower_bound, 1),
                "upper": round(upper_bound, 1),
            },
            "formattedPredictedTime": format_minutes_duration(pred_mean),
            "formattedRange": f"{format_minutes_duration(lower_bound)} — {format_minutes_duration(upper_bound)}",
            "confidenceLevel": "80% Confidence Interval",
            "targetCaseId": cid,
        }

    def save(self, filepath: str) -> None:
        joblib.dump(self.model, filepath)

    @classmethod
    def load(cls, filepath: str) -> "RemainingTimePredictor":
        loaded_model = joblib.load(filepath)
        return cls(model=loaded_model)
