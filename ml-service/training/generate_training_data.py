"""
FlowLens AI - Synthetic Process Training Data Generator
Generates >= 20,000 process cases across 8 operational patterns with ground-truth labels.
Compatible with the FlowLens CSV parser.
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd


PATTERNS = [
    "WAITING_BOTTLENECK",
    "PROCESSING_BOTTLENECK",
    "RESOURCE_BOTTLENECK",
    "HIGH_VARIABILITY_BOTTLENECK",
    "HIGH_VOLUME_BOTTLENECK",
    "PEAK_PERIOD_BOTTLENECK",
    "COMPETING_BOTTLENECKS",
    "MIGRATION_SCENARIO",
]

DEFAULT_STAGES = ["Intake", "Verification", "Review", "Approval", "Fulfillment"]
PRIORITIES = ["NORMAL", "NORMAL", "NORMAL", "HIGH", "URGENT", "LOW"]
LOCATIONS = ["HQ-East", "HQ-West", "Regional-Alpha", "Hub-Central", "Facility-1"]


def generate_pattern_cases(
    pattern: str,
    num_cases: int,
    start_case_num: int,
    base_timestamp: datetime,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Generate synthetic cases for a specific operational pattern.
    Returns:
        events: List of raw event dicts compatible with FlowLens CSV parser.
        scenario_metadata: Known simulation parameters and ground-truth labels.
    """
    events = []
    case_labels = {}

    # Define stage behaviors based on pattern
    # Base durations (minutes): Intake: 10, Verification: 20, Review: 45, Approval: 15, Fulfillment: 25
    for i in range(num_cases):
        case_id = f"C{start_case_num + i:05d}"
        case_prio = random.choice(PRIORITIES)
        case_loc = random.choice(LOCATIONS)

        # Stagger case arrivals across a 30-day operating window
        day_offset = random.uniform(0, 30)
        hour_of_day = random.choices(
            range(24),
            weights=[1, 1, 1, 1, 1, 2, 4, 8, 14, 16, 15, 12, 11, 14, 15, 14, 10, 7, 5, 3, 2, 1, 1, 1],
        )[0]
        minute_of_hour = random.randint(0, 59)

        current_time = base_timestamp + timedelta(
            days=day_offset, hours=hour_of_day, minutes=minute_of_hour
        )

        is_anomalous_case = random.random() < 0.12  # ~12% anomalies

        stage_sequence = list(DEFAULT_STAGES)
        # Rework injection
        if is_anomalous_case and random.random() < 0.4:
            # Revisit Review or Verification
            stage_sequence.insert(3, "Review")
        elif pattern == "HIGH_VOLUME_BOTTLENECK" and random.random() < 0.25:
            stage_sequence.insert(2, "Verification")

        # Determine target future bottleneck for this pattern
        if pattern == "WAITING_BOTTLENECK":
            gt_bottleneck = "Verification"
        elif pattern == "PROCESSING_BOTTLENECK":
            gt_bottleneck = "Review"
        elif pattern == "RESOURCE_BOTTLENECK":
            gt_bottleneck = "Approval"
        elif pattern == "HIGH_VARIABILITY_BOTTLENECK":
            gt_bottleneck = "Verification"
        elif pattern == "HIGH_VOLUME_BOTTLENECK":
            gt_bottleneck = "Intake"
        elif pattern == "PEAK_PERIOD_BOTTLENECK":
            gt_bottleneck = "Fulfillment"
        elif pattern == "COMPETING_BOTTLENECKS":
            gt_bottleneck = "Review"
        elif pattern == "MIGRATION_SCENARIO":
            gt_bottleneck = "Approval"
        else:
            gt_bottleneck = "Review"

        case_start = current_time

        for idx, stage in enumerate(stage_sequence):
            # Base waiting and processing
            proc_mean = 15.0
            proc_std = 4.0
            wait_mean = 10.0
            wait_std = 3.0

            # Tailor by stage
            if stage == "Intake":
                proc_mean = 12.0
                wait_mean = 5.0
                resources = ["R_INTAKE_01", "R_INTAKE_02", "R_INTAKE_03"]
            elif stage == "Verification":
                proc_mean = 22.0
                wait_mean = 18.0
                resources = ["R_VERIF_01", "R_VERIF_02"]
            elif stage == "Review":
                proc_mean = 45.0
                wait_mean = 25.0
                resources = ["R_REV_01", "R_REV_02", "R_REV_03"]
            elif stage == "Approval":
                proc_mean = 15.0
                wait_mean = 20.0
                resources = ["R_APP_01", "R_APP_02"]
            else:  # Fulfillment
                proc_mean = 25.0
                wait_mean = 15.0
                resources = ["R_FUL_01", "R_FUL_02", "R_FUL_03"]

            # Apply pattern distortions
            if pattern == "WAITING_BOTTLENECK" and stage == "Verification":
                wait_mean = 140.0
                wait_std = 35.0
            elif pattern == "PROCESSING_BOTTLENECK" and stage == "Review":
                proc_mean = 160.0
                proc_std = 40.0
            elif pattern == "RESOURCE_BOTTLENECK" and stage == "Approval":
                resources = ["R_APP_STARVED_01"]  # Single resource bottleneck
                wait_mean = 110.0
                wait_std = 45.0
            elif pattern == "HIGH_VARIABILITY_BOTTLENECK" and stage == "Verification":
                proc_mean = 35.0
                proc_std = 75.0  # Massive variance
                wait_mean = 85.0
                wait_std = 60.0
            elif pattern == "HIGH_VOLUME_BOTTLENECK" and stage == "Intake":
                proc_mean = 25.0
                wait_mean = 60.0
            elif pattern == "PEAK_PERIOD_BOTTLENECK" and stage == "Fulfillment":
                if hour_of_day in [10, 11, 14, 15]:
                    wait_mean = 135.0
                    wait_std = 40.0
            elif pattern == "COMPETING_BOTTLENECKS":
                if stage == "Verification":
                    wait_mean = 70.0
                elif stage == "Review":
                    wait_mean = 95.0
                    proc_mean = 65.0
            elif pattern == "MIGRATION_SCENARIO":
                # Upstream Verification was improved; pressure transferred to Approval
                if stage == "Verification":
                    wait_mean = 12.0
                elif stage == "Approval":
                    wait_mean = 130.0
                    proc_mean = 30.0

            # Inject case anomaly
            if is_anomalous_case:
                if random.random() < 0.5:
                    wait_mean *= random.uniform(3.5, 7.0)
                else:
                    proc_mean *= random.uniform(3.0, 6.0)

            # Sample durations
            sampled_wait = max(0.0, np.random.normal(wait_mean, max(1.0, wait_std)))
            sampled_proc = max(2.0, np.random.normal(proc_mean, max(1.0, proc_std)))

            # If first event in case, waiting time before event is 0
            if idx == 0:
                sampled_wait = 0.0

            ev_start = current_time + timedelta(minutes=sampled_wait)
            ev_end = ev_start + timedelta(minutes=sampled_proc)
            current_time = ev_end

            assigned_res = random.choice(resources)

            events.append({
                "case_id": case_id,
                "activity": stage,
                "start_time": ev_start.strftime("%Y-%m-%d %H:%M:%S"),
                "end_time": ev_end.strftime("%Y-%m-%d %H:%M:%S"),
                "resource_id": assigned_res,
                "priority": case_prio,
                "status": "completed",
                "location": case_loc,
            })

        case_end = current_time
        case_total_mins = (case_end - case_start).total_seconds() / 60.0

        case_labels[case_id] = {
            "future_bottleneck_stage": gt_bottleneck,
            "is_anomaly": 1 if is_anomalous_case else 0,
            "total_duration_minutes": case_total_mins,
            "case_start": case_start,
            "case_end": case_end,
        }

    return events, {"pattern": pattern, "gt_bottleneck": gt_bottleneck, "case_labels": case_labels}


def generate_full_synthetic_dataset(
    cases_per_pattern: int = 2500,
    base_date: str = "2026-08-01 08:00:00",
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generate at least 20,000 cases across all 8 patterns.
    Returns:
        events_df: DataFrame of all events compatible with FlowLens CSV parser.
        case_ground_truth_df: DataFrame of ground-truth labels for each case.
    """
    base_ts = datetime.strptime(base_date, "%Y-%m-%d %H:%M:%S")
    all_events = []
    all_case_labels = []

    case_counter = 1
    for pattern in PATTERNS:
        pattern_events, metadata = generate_pattern_cases(
            pattern=pattern,
            num_cases=cases_per_pattern,
            start_case_num=case_counter,
            base_timestamp=base_ts,
        )
        all_events.extend(pattern_events)

        for cid, lbl in metadata["case_labels"].items():
            all_case_labels.append({
                "case_id": cid,
                "pattern": pattern,
                "future_bottleneck_stage": lbl["future_bottleneck_stage"],
                "is_anomaly": lbl["is_anomaly"],
                "total_duration_minutes": lbl["total_duration_minutes"],
            })

        case_counter += cases_per_pattern

    events_df = pd.DataFrame(all_events)
    case_labels_df = pd.DataFrame(all_case_labels)

    return events_df, case_labels_df


if __name__ == "__main__":
    print("Generating >= 20,000 synthetic process cases across 8 patterns...")
    events_df, labels_df = generate_full_synthetic_dataset(cases_per_pattern=2500)
    print(f"Generated {len(labels_df)} cases and {len(events_df)} events.")
    print("Patterns distribution:")
    print(labels_df["pattern"].value_counts())
    print("\nBottleneck distribution:")
    print(labels_df["future_bottleneck_stage"].value_counts())
    print(f"\nAnomaly rate: {labels_df['is_anomaly'].mean() * 100:.2f}%")
