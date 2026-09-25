"""
FlowLens AI - Universal Process Feature Engineering
Reusable across Training, Validation, and Production Inference.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from datetime import datetime

STAGE_FEATURE_NAMES = [
    "stage_processing_mean",
    "stage_processing_std",
    "stage_waiting_mean",
    "stage_waiting_std",
    "processing_contribution",
    "waiting_contribution",
    "event_volume",
    "resource_load",
    "queue_length",
    "peak_hour_load",
    "cycle_time",
    "processing_time",
    "waiting_time",
    "process_efficiency",
    "upstream_delay",
    "downstream_delay",
    "priority_mix",
    "rework_frequency",
    "stage_frequency",
]

CASE_ANOMALY_FEATURE_NAMES = [
    "cycle_time",
    "waiting_time",
    "processing_time",
    "queue_wait",
    "stage_count",
    "resource_load",
    "rework_frequency",
]

REMAINING_TIME_FEATURE_NAMES = [
    "completed_stage_count",
    "remaining_stage_count",
    "current_stage_progress",
    "elapsed_time",
    "historical_stage_processing",
    "historical_stage_waiting",
    "case_priority",
    "resource_load",
    "process_efficiency",
]


def _normalize_event_keys(event: Dict[str, Any]) -> Dict[str, Any]:
    """Support both camelCase and snake_case keys."""
    return {
        "case_id": str(event.get("caseId") or event.get("case_id") or "UNKNOWN"),
        "activity": str(event.get("activity") or event.get("stage") or "UNKNOWN"),
        "start_time": event.get("startTime") or event.get("start_time"),
        "end_time": event.get("endTime") or event.get("end_time"),
        "resource_id": str(event.get("resourceId") or event.get("resource_id") or "UNKNOWN"),
        "priority": str(event.get("priority") or "NORMAL").upper(),
        "status": str(event.get("status") or "completed"),
        "location": str(event.get("location") or ""),
    }


def parse_events_to_df(events: List[Dict[str, Any]]) -> pd.DataFrame:
    """Parse raw event dicts to normalized DataFrame with millisecond timestamps."""
    if not events:
        return pd.DataFrame()

    normalized = [_normalize_event_keys(e) for e in events]
    df = pd.DataFrame(normalized)

    # Parse timestamps
    df["start_dt"] = pd.to_datetime(df["start_time"], errors="coerce", format="mixed")
    df["end_dt"] = pd.to_datetime(df["end_time"], errors="coerce", format="mixed")

    # Drop invalid timestamps
    df = df.dropna(subset=["start_dt", "end_dt"])
    if df.empty:
        return df

    # Ensure start <= end
    mask_invert = df["end_dt"] < df["start_dt"]
    if mask_invert.any():
        df.loc[mask_invert, "end_dt"] = df.loc[mask_invert, "start_dt"] + pd.Timedelta(minutes=5)

    df["processing_time_min"] = (df["end_dt"] - df["start_dt"]).dt.total_seconds() / 60.0

    # Sort chronologically within case
    df = df.sort_values(by=["case_id", "start_dt"]).reset_index(drop=True)

    # Calculate waiting time before each event within case
    df["prev_end_dt"] = df.groupby("case_id")["end_dt"].shift(1)
    df["waiting_time_min"] = (df["start_dt"] - df["prev_end_dt"]).dt.total_seconds() / 60.0
    df["waiting_time_min"] = df["waiting_time_min"].fillna(0.0).clip(lower=0.0)

    # Hour of day for peak detection
    df["start_hour"] = df["start_dt"].dt.hour

    return df


def extract_stage_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Extract the 19 standard process features for each stage in the event log.
    Returns:
        stage_features_df: DataFrame where index is activity name and columns are STAGE_FEATURE_NAMES.
        global_context: Dict with overall process stats.
    """
    if df.empty:
        empty_df = pd.DataFrame(columns=STAGE_FEATURE_NAMES)
        return empty_df, {}

    total_process_processing = df["processing_time_min"].sum()
    total_process_waiting = df["waiting_time_min"].sum()
    total_cases = df["case_id"].nunique() or 1

    # Case-level stats
    case_summary = df.groupby("case_id").agg(
        case_start=("start_dt", "min"),
        case_end=("end_dt", "max"),
        case_proc=("processing_time_min", "sum"),
        case_wait=("waiting_time_min", "sum"),
    )
    case_summary["case_cycle"] = (
        case_summary["case_end"] - case_summary["case_start"]
    ).dt.total_seconds() / 60.0
    avg_cycle_time = case_summary["case_cycle"].mean()

    # Peak hours (hours with > 1.25x average hourly volume)
    hourly_counts = df["start_hour"].value_counts()
    mean_hourly_vol = hourly_counts.mean() if not hourly_counts.empty else 1.0
    peak_hours = set(hourly_counts[hourly_counts >= 1.25 * mean_hourly_vol].index)
    if not peak_hours:
        # Default operational peaks 9-11 and 14-16
        peak_hours = {9, 10, 11, 14, 15, 16}

    # Transition matrix for upstream/downstream delays
    df["next_activity"] = df.groupby("case_id")["activity"].shift(-1)
    df["next_waiting"] = df.groupby("case_id")["waiting_time_min"].shift(-1)

    upstream_delays = df.groupby("activity")["waiting_time_min"].mean().to_dict()
    downstream_delays = df.groupby("activity")["next_waiting"].mean().fillna(0.0).to_dict()

    # Stage level aggregations
    stages = []
    for stage_name, grp in df.groupby("activity"):
        proc_mean = grp["processing_time_min"].mean()
        proc_std = grp["processing_time_min"].std()
        proc_std = 0.0 if np.isnan(proc_std) else proc_std

        wait_mean = grp["waiting_time_min"].mean()
        wait_std = grp["waiting_time_min"].std()
        wait_std = 0.0 if np.isnan(wait_std) else wait_std

        stage_tot_proc = grp["processing_time_min"].sum()
        stage_tot_wait = grp["waiting_time_min"].sum()

        proc_contrib = (
            (stage_tot_proc / total_process_processing * 100.0)
            if total_process_processing > 0
            else 0.0
        )
        wait_contrib = (
            (stage_tot_wait / total_process_waiting * 100.0)
            if total_process_waiting > 0
            else 0.0
        )

        vol = len(grp)
        unique_res = grp["resource_id"].nunique() or 1
        res_load = vol / unique_res

        # Queue proxy: events where waiting time > 2x stage average or high wait
        q_len = (grp["waiting_time_min"] > wait_mean).sum() / max(1, unique_res)

        peak_events = grp["start_hour"].isin(peak_hours).sum()
        peak_load = peak_events / vol if vol > 0 else 0.0

        stage_sum_time = stage_tot_proc + stage_tot_wait
        eff = (stage_tot_proc / stage_sum_time * 100.0) if stage_sum_time > 0 else 100.0

        up_delay = upstream_delays.get(stage_name, 0.0)
        down_delay = downstream_delays.get(stage_name, 0.0)

        # Priority mix: proportion of URGENT or HIGH
        prio_high = grp["priority"].isin(["HIGH", "URGENT", "EMERGENCY", "CRITICAL"]).sum()
        prio_mix = prio_high / vol if vol > 0 else 0.0

        # Rework frequency: cases that visit this stage > 1 time
        case_visits = grp.groupby("case_id").size()
        rework_count = (case_visits > 1).sum()
        rework_freq = rework_count / total_cases

        stage_freq = grp["case_id"].nunique() / total_cases

        stages.append({
            "stage": stage_name,
            "stage_processing_mean": float(proc_mean),
            "stage_processing_std": float(proc_std),
            "stage_waiting_mean": float(wait_mean),
            "stage_waiting_std": float(wait_std),
            "processing_contribution": float(proc_contrib),
            "waiting_contribution": float(wait_contrib),
            "event_volume": float(vol),
            "resource_load": float(res_load),
            "queue_length": float(q_len),
            "peak_hour_load": float(peak_load),
            "cycle_time": float(avg_cycle_time),
            "processing_time": float(stage_tot_proc),
            "waiting_time": float(stage_tot_wait),
            "process_efficiency": float(eff),
            "upstream_delay": float(up_delay),
            "downstream_delay": float(down_delay),
            "priority_mix": float(prio_mix),
            "rework_frequency": float(rework_freq),
            "stage_frequency": float(stage_freq),
        })

    stage_features_df = pd.DataFrame(stages).set_index("stage")
    stage_features_df = stage_features_df[STAGE_FEATURE_NAMES]

    global_context = {
        "total_cases": total_cases,
        "avg_cycle_time": avg_cycle_time,
        "total_processing": total_process_processing,
        "total_waiting": total_process_waiting,
        "stages": list(stage_features_df.index),
    }

    return stage_features_df, global_context


def extract_case_anomaly_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """
    Extract case-level feature vectors for IsolationForest anomaly detection.
    Features: cycle_time, waiting_time, processing_time, queue_wait, stage_count, resource_load, rework_frequency.
    """
    if df.empty:
        return pd.DataFrame(columns=CASE_ANOMALY_FEATURE_NAMES), []

    cases = []
    case_ids = []

    for case_id, grp in df.groupby("case_id"):
        c_start = grp["start_dt"].min()
        c_end = grp["end_dt"].max()
        cycle = (c_end - c_start).total_seconds() / 60.0
        proc = grp["processing_time_min"].sum()
        wait = grp["waiting_time_min"].sum()
        max_q = grp["waiting_time_min"].max()
        stg_cnt = len(grp)
        u_res = grp["resource_id"].nunique()
        res_load = stg_cnt / max(1, u_res)

        # Rework: repeated stages within this case
        repeated = grp["activity"].duplicated().sum()

        cases.append({
            "cycle_time": float(cycle),
            "waiting_time": float(wait),
            "processing_time": float(proc),
            "queue_wait": float(max_q),
            "stage_count": float(stg_cnt),
            "resource_load": float(res_load),
            "rework_frequency": float(repeated),
        })
        case_ids.append(str(case_id))

    case_df = pd.DataFrame(cases, index=case_ids)[CASE_ANOMALY_FEATURE_NAMES]
    return case_df, case_ids


def extract_remaining_time_features(
    df: pd.DataFrame,
    active_case_id: Optional[str] = None,
    stage_reference: Optional[Dict[str, Dict[str, float]]] = None,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Extract feature vectors for remaining time prediction.
    If active_case_id is provided, extracts for that case at its latest state.
    Otherwise extracts for all cases simulating varying completion stages.
    """
    if df.empty:
        return pd.DataFrame(columns=REMAINING_TIME_FEATURE_NAMES), []

    # Compute baseline stage processing and waiting references if not provided
    if not stage_reference:
        stage_stats = df.groupby("activity").agg(
            proc_mean=("processing_time_min", "mean"),
            wait_mean=("waiting_time_min", "mean"),
        ).to_dict(orient="index")
    else:
        stage_stats = stage_reference

    # Typical workflow stage order across dataset
    stage_order = df.groupby("activity")["start_dt"].min().sort_values().index.tolist()
    total_expected_stages = max(len(stage_order), 3)

    records = []
    case_ids = []

    case_groups = [
        (active_case_id, df[df["case_id"] == active_case_id])
    ] if active_case_id else df.groupby("case_id")

    for cid, grp in case_groups:
        if grp.empty:
            continue
        grp = grp.sort_values("start_dt")
        completed_stages = grp["activity"].tolist()
        completed_cnt = len(completed_stages)
        remaining_cnt = max(0, total_expected_stages - completed_cnt)

        progress = completed_cnt / max(total_expected_stages, completed_cnt)
        c_start = grp["start_dt"].min()
        c_latest = grp["end_dt"].max()
        elapsed = (c_latest - c_start).total_seconds() / 60.0

        # Remaining stages estimates
        remaining_stages = [s for s in stage_order if s not in completed_stages]
        if not remaining_stages and remaining_cnt > 0:
            remaining_stages = stage_order[-remaining_cnt:]

        hist_proc = sum(stage_stats.get(s, {}).get("proc_mean", 15.0) for s in remaining_stages)
        hist_wait = sum(stage_stats.get(s, {}).get("wait_mean", 30.0) for s in remaining_stages)

        prio_str = grp["priority"].iloc[-1] if "priority" in grp else "NORMAL"
        prio_code = 3.0 if prio_str in ["HIGH", "URGENT", "EMERGENCY"] else (1.0 if prio_str == "LOW" else 2.0)

        res_cnt = grp["resource_id"].nunique()
        res_load = completed_cnt / max(1, res_cnt)

        tot_proc = grp["processing_time_min"].sum()
        eff = (tot_proc / elapsed * 100.0) if elapsed > 0 else 100.0

        records.append({
            "completed_stage_count": float(completed_cnt),
            "remaining_stage_count": float(remaining_cnt),
            "current_stage_progress": float(progress),
            "elapsed_time": float(elapsed),
            "historical_stage_processing": float(hist_proc),
            "historical_stage_waiting": float(hist_wait),
            "case_priority": float(prio_code),
            "resource_load": float(res_load),
            "process_efficiency": float(eff),
        })
        case_ids.append(str(cid))

    res_df = pd.DataFrame(records, index=case_ids)[REMAINING_TIME_FEATURE_NAMES]
    return res_df, case_ids


def extract_all_features_from_events(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Single master extraction function for online inference."""
    df = parse_events_to_df(events)
    if df.empty:
        return {
            "df": df,
            "stage_features": pd.DataFrame(columns=STAGE_FEATURE_NAMES),
            "case_anomaly_features": pd.DataFrame(columns=CASE_ANOMALY_FEATURE_NAMES),
            "remaining_time_features": pd.DataFrame(columns=REMAINING_TIME_FEATURE_NAMES),
            "global_context": {},
            "case_ids": [],
        }

    stage_features, global_context = extract_stage_features(df)
    case_anomaly_features, case_ids = extract_case_anomaly_features(df)
    remaining_time_features, _ = extract_remaining_time_features(df)

    return {
        "df": df,
        "stage_features": stage_features,
        "case_anomaly_features": case_anomaly_features,
        "remaining_time_features": remaining_time_features,
        "global_context": global_context,
        "case_ids": case_ids,
    }
