"""
FlowLens AI - Model Training & Rigorous Validation Pipeline
Trains:
  1. BottleneckForecaster (RandomForestClassifier)
  2. AnomalyDetector (IsolationForest)
  3. RemainingTimePredictor (RandomForestRegressor)
Uses Train/Validation/Test splits and saves evaluation metrics to artifacts/evaluation_report.json.
"""

import os
import sys
import json
from typing import Dict, Any

# Ensure ml-service root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)

from features.feature_engineering import (
    STAGE_FEATURE_NAMES,
    CASE_ANOMALY_FEATURE_NAMES,
    REMAINING_TIME_FEATURE_NAMES,
    parse_events_to_df,
    extract_stage_features,
    extract_case_anomaly_features,
)
from training.generate_training_data import generate_full_synthetic_dataset
from models.bottleneck_forecaster import BottleneckForecaster
from models.anomaly_detector import AnomalyDetector
from models.remaining_time import RemainingTimePredictor

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))


def prepare_training_datasets(cases_per_pattern: int = 2500):
    """Generate 20,000 cases and build features for all 3 models."""
    print(f"Generating synthetic cases ({cases_per_pattern} per pattern * 8 patterns = {cases_per_pattern*8} cases)...")
    events_df, case_labels_df = generate_full_synthetic_dataset(cases_per_pattern=cases_per_pattern)
    events_raw = events_df.to_dict(orient="records")

    print("Parsing events and computing timestamps...")
    parsed_df = parse_events_to_df(events_raw)

    # -------------------------------------------------------------
    # 1. Prepare Bottleneck Forecasting Dataset (Windowed Stage Samples)
    # -------------------------------------------------------------
    print("Extracting stage feature windows for BottleneckForecaster...")
    stage_samples = []
    # Slice cases by pattern and sliding windows of 50 cases to capture varied operating conditions
    window_size = 50
    for pattern, p_labels in case_labels_df.groupby("pattern"):
        cids = p_labels["case_id"].tolist()
        gt_stage = p_labels["future_bottleneck_stage"].iloc[0]

        for i in range(0, len(cids), window_size):
            win_cids = set(cids[i : i + window_size])
            if len(win_cids) < 15:
                continue
            win_df = parsed_df[parsed_df["case_id"].isin(win_cids)]
            if win_df.empty:
                continue

            stage_feat, _ = extract_stage_features(win_df)
            for s_name, row in stage_feat.iterrows():
                is_target = 1 if s_name == gt_stage else 0
                sample = row.to_dict()
                sample["is_bottleneck"] = is_target
                sample["stage_name"] = s_name
                sample["pattern"] = pattern
                stage_samples.append(sample)

    stage_dataset = pd.DataFrame(stage_samples)

    # -------------------------------------------------------------
    # 2. Prepare Case Anomaly Dataset
    # -------------------------------------------------------------
    print("Extracting case features for AnomalyDetector...")
    case_feat_df, case_ids = extract_case_anomaly_features(parsed_df)
    labels_map = case_labels_df.set_index("case_id")["is_anomaly"].to_dict()
    case_feat_df["is_anomaly"] = [labels_map.get(cid, 0) for cid in case_ids]

    # -------------------------------------------------------------
    # 3. Prepare Remaining Time Dataset
    # -------------------------------------------------------------
    print("Extracting prefix states for RemainingTimePredictor...")
    # Calculate baseline stage averages
    stage_stats = parsed_df.groupby("activity").agg(
        proc_mean=("processing_time_min", "mean"),
        wait_mean=("waiting_time_min", "mean"),
    ).to_dict(orient="index")

    # Workflow stage sequence
    stage_seq = ["Intake", "Verification", "Review", "Approval", "Fulfillment"]
    stage_idx_map = {s: i for i, s in enumerate(stage_seq)}

    rem_samples = []
    # Sample a representative subset of cases across prefixes
    sample_cids = case_labels_df["case_id"].sample(min(8000, len(case_labels_df)), random_state=42).tolist()
    sample_df = parsed_df[parsed_df["case_id"].isin(sample_cids)]

    for cid, grp in sample_df.groupby("case_id"):
        grp = grp.sort_values("start_dt")
        total_evs = len(grp)
        if total_evs <= 1:
            continue

        c_start = grp["start_dt"].min()
        c_end = grp["end_dt"].max()
        full_duration = (c_end - c_start).total_seconds() / 60.0

        # Simulate case at prefix k (e.g. after stage 1, 2, or 3)
        for k in range(1, total_evs):
            prefix = grp.iloc[:k]
            current_latest = prefix["end_dt"].max()
            elapsed = (current_latest - c_start).total_seconds() / 60.0
            remaining_mins = max(0.0, full_duration - elapsed)

            completed_cnt = k
            rem_cnt = total_evs - k
            progress = completed_cnt / total_evs

            # Remaining stages
            rem_stages = grp.iloc[k:]["activity"].tolist()
            hist_proc = sum(stage_stats.get(s, {}).get("proc_mean", 15.0) for s in rem_stages)
            hist_wait = sum(stage_stats.get(s, {}).get("wait_mean", 25.0) for s in rem_stages)

            prio_str = prefix["priority"].iloc[-1]
            prio_code = 3.0 if prio_str in ["HIGH", "URGENT"] else (1.0 if prio_str == "LOW" else 2.0)
            u_res = prefix["resource_id"].nunique()
            res_load = completed_cnt / max(1, u_res)

            proc_so_far = prefix["processing_time_min"].sum()
            eff = (proc_so_far / elapsed * 100.0) if elapsed > 0 else 100.0

            rem_samples.append({
                "completed_stage_count": float(completed_cnt),
                "remaining_stage_count": float(rem_cnt),
                "current_stage_progress": float(progress),
                "elapsed_time": float(elapsed),
                "historical_stage_processing": float(hist_proc),
                "historical_stage_waiting": float(hist_wait),
                "case_priority": float(prio_code),
                "resource_load": float(res_load),
                "process_efficiency": float(eff),
                "remaining_time_minutes": float(remaining_mins),
            })

    rem_dataset = pd.DataFrame(rem_samples)

    return stage_dataset, case_feat_df, rem_dataset


def train_and_evaluate_all():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    stage_df, case_anom_df, rem_df = prepare_training_datasets(cases_per_pattern=2500)

    report: Dict[str, Any] = {
        "dataset_summary": {
            "total_synthetic_cases": len(case_anom_df),
            "stage_window_samples": len(stage_df),
            "remaining_time_samples": len(rem_df),
            "patterns": [
                "WAITING_BOTTLENECK",
                "PROCESSING_BOTTLENECK",
                "RESOURCE_BOTTLENECK",
                "HIGH_VARIABILITY_BOTTLENECK",
                "HIGH_VOLUME_BOTTLENECK",
                "PEAK_PERIOD_BOTTLENECK",
                "COMPETING_BOTTLENECKS",
                "MIGRATION_SCENARIO",
            ],
        },
        "models": {},
    }

    # =========================================================
    # 1. Train Bottleneck Forecaster
    # =========================================================
    print("\n--- Training Bottleneck Forecaster (RandomForestClassifier) ---")
    X_bf = stage_df[STAGE_FEATURE_NAMES]
    y_bf = stage_df["is_bottleneck"]

    X_train_bf, X_test_bf, y_train_bf, y_test_bf = train_test_split(
        X_bf, y_bf, test_size=0.25, random_state=42, stratify=y_bf
    )

    bf_model = BottleneckForecaster()
    bf_model.fit(X_train_bf, y_train_bf)

    y_pred_bf = bf_model.model.predict(X_test_bf.values)
    y_prob_bf = bf_model.model.predict_proba(X_test_bf.values)[:, 1]

    acc_bf = float(accuracy_score(y_test_bf, y_pred_bf))
    prec_bf = float(precision_score(y_test_bf, y_pred_bf, zero_division=0))
    rec_bf = float(recall_score(y_test_bf, y_pred_bf, zero_division=0))
    f1_bf = float(f1_score(y_test_bf, y_pred_bf, zero_division=0))
    cm_bf = confusion_matrix(y_test_bf, y_pred_bf).tolist()
    auc_bf = float(roc_auc_score(y_test_bf, y_prob_bf))

    print(f"Bottleneck Forecaster Test Accuracy:  {acc_bf:.4f}")
    print(f"Bottleneck Forecaster Test Precision: {prec_bf:.4f}")
    print(f"Bottleneck Forecaster Test Recall:    {rec_bf:.4f}")
    print(f"Bottleneck Forecaster Test F1:        {f1_bf:.4f}")
    print(f"Bottleneck Forecaster Test ROC-AUC:   {auc_bf:.4f}")
    print("Confusion Matrix:", cm_bf)

    bf_path = os.path.join(ARTIFACTS_DIR, "bottleneck_forecaster.joblib")
    bf_model.save(bf_path)
    print(f"Saved Bottleneck Forecaster to {bf_path}")

    report["models"]["bottleneck_forecaster"] = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 120,
        "max_depth": 10,
        "train_samples": len(X_train_bf),
        "test_samples": len(X_test_bf),
        "metrics": {
            "accuracy": round(acc_bf, 4),
            "precision": round(prec_bf, 4),
            "recall": round(rec_bf, 4),
            "f1_score": round(f1_bf, 4),
            "roc_auc": round(auc_bf, 4),
            "confusion_matrix": cm_bf,
        },
        "feature_importances": {
            fname: round(float(imp), 4)
            for fname, imp in zip(STAGE_FEATURE_NAMES, bf_model.model.feature_importances_)
        },
    }

    # =========================================================
    # 2. Train Anomaly Detector (IsolationForest)
    # =========================================================
    print("\n--- Training Anomaly Detector (IsolationForest) ---")
    X_anom = case_anom_df[CASE_ANOMALY_FEATURE_NAMES]
    y_anom_true = case_anom_df["is_anomaly"]

    X_train_anom, X_test_anom, y_train_anom, y_test_anom = train_test_split(
        X_anom, y_anom_true, test_size=0.25, random_state=42, stratify=y_anom_true
    )

    ad_model = AnomalyDetector()
    ad_model.fit(X_train_anom)

    # Evaluate against synthetic ground truth anomalies
    test_scores_raw = ad_model.model.decision_function(X_test_anom.values)
    norm_scores = np.clip(0.5 - (test_scores_raw * 1.5), 0.0, 1.0)
    y_pred_anom = (norm_scores >= 0.65).astype(int)

    acc_anom = float(accuracy_score(y_test_anom, y_pred_anom))
    prec_anom = float(precision_score(y_test_anom, y_pred_anom, zero_division=0))
    rec_anom = float(recall_score(y_test_anom, y_pred_anom, zero_division=0))
    f1_anom = float(f1_score(y_test_anom, y_pred_anom, zero_division=0))
    auc_anom = float(roc_auc_score(y_test_anom, norm_scores))

    print(f"Anomaly Detector Test Precision: {prec_anom:.4f}")
    print(f"Anomaly Detector Test Recall:    {rec_anom:.4f}")
    print(f"Anomaly Detector Test F1:        {f1_anom:.4f}")
    print(f"Anomaly Detector Test ROC-AUC:   {auc_anom:.4f}")

    ad_path = os.path.join(ARTIFACTS_DIR, "anomaly_detector.joblib")
    ad_model.save(ad_path)
    print(f"Saved Anomaly Detector to {ad_path}")

    report["models"]["anomaly_detector"] = {
        "model_type": "IsolationForest",
        "contamination": 0.12,
        "n_estimators": 150,
        "train_samples": len(X_train_anom),
        "test_samples": len(X_test_anom),
        "metrics": {
            "accuracy": round(acc_anom, 4),
            "precision": round(prec_anom, 4),
            "recall": round(rec_anom, 4),
            "f1_score": round(f1_anom, 4),
            "roc_auc": round(auc_anom, 4),
        },
    }

    # =========================================================
    # 3. Train Remaining Time Predictor (RandomForestRegressor)
    # =========================================================
    print("\n--- Training Remaining Time Predictor (RandomForestRegressor) ---")
    X_rem = rem_df[REMAINING_TIME_FEATURE_NAMES]
    y_rem = rem_df["remaining_time_minutes"]

    X_train_rem, X_test_rem, y_train_rem, y_test_rem = train_test_split(
        X_rem, y_rem, test_size=0.20, random_state=42
    )

    rt_model = RemainingTimePredictor()
    rt_model.fit(X_train_rem, y_train_rem)

    y_pred_rem = rt_model.model.predict(X_test_rem.values)

    mae_rem = float(mean_absolute_error(y_test_rem, y_pred_rem))
    rmse_rem = float(np.sqrt(mean_squared_error(y_test_rem, y_pred_rem)))
    r2_rem = float(r2_score(y_test_rem, y_pred_rem))

    print(f"Remaining Time Predictor Test MAE:  {mae_rem:.2f} mins")
    print(f"Remaining Time Predictor Test RMSE: {rmse_rem:.2f} mins")
    print(f"Remaining Time Predictor Test R²:   {r2_rem:.4f}")

    rt_path = os.path.join(ARTIFACTS_DIR, "remaining_time.joblib")
    rt_model.save(rt_path)
    print(f"Saved Remaining Time Predictor to {rt_path}")

    report["models"]["remaining_time_predictor"] = {
        "model_type": "RandomForestRegressor",
        "n_estimators": 100,
        "max_depth": 12,
        "train_samples": len(X_train_rem),
        "test_samples": len(X_test_rem),
        "metrics": {
            "mae_minutes": round(mae_rem, 2),
            "rmse_minutes": round(rmse_rem, 2),
            "r2_score": round(r2_rem, 4),
        },
        "feature_importances": {
            fname: round(float(imp), 4)
            for fname, imp in zip(REMAINING_TIME_FEATURE_NAMES, rt_model.model.feature_importances_)
        },
    }

    # Save evaluation report
    report_path = os.path.join(ARTIFACTS_DIR, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nSaved full Evaluation Report to {report_path}")

    return report


if __name__ == "__main__":
    train_and_evaluate_all()
