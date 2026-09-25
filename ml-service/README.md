# FlowLens AI — Machine Learning Service

A dedicated Python FastAPI microservice providing genuine predictive intelligence and anomaly detection for the FlowLens AI platform.

## Architectural Principle

- **Deterministic Process Engine** = What is happening now (Observed historical reality)
- **Predictive ML** = What is likely to happen next (Bottleneck forecasting, anomaly detection, remaining duration)
- **What-If Simulation** = What may happen if we intervene (Counterfactual scenario analysis)
- **Gemini AI** = Explains the evidence (Synthesizing observed, predicted, and simulated insights)

The ML service never replaces the deterministic engine or What-If simulator. It operates purely as an advisory and forecasting layer.

---

## Service Architecture

```
ml-service/
├── app.py                      # FastAPI application with REST endpoints
├── requirements.txt            # Dependency manifest (FastAPI, scikit-learn, etc.)
├── README.md                   # Service documentation & deployment guide
├── features/
│   ├── __init__.py
│   └── feature_engineering.py  # 19 universal process features
├── models/
│   ├── __init__.py
│   ├── bottleneck_forecaster.py # RandomForestClassifier
│   ├── anomaly_detector.py      # IsolationForest
│   └── remaining_time.py        # RandomForestRegressor
├── training/
│   ├── __init__.py
│   ├── generate_training_data.py # Synthetic multi-pattern generator (>=20,000 cases)
│   └── train_models.py           # Train/Validation/Test pipeline
├── inference/
│   ├── __init__.py
│   └── predictor.py             # Inference coordinator & What-If synthesis
├── tests/
│   ├── __init__.py
│   └── test_ml_service.py       # Automated test suite
└── artifacts/
    ├── bottleneck_forecaster.joblib
    ├── anomaly_detector.joblib
    ├── remaining_time.joblib
    └── evaluation_report.json
```

---

## Universal Feature Engineering

The service extracts 19 stage-level features and 7 case-level features from normalized event logs:

1. `stage_processing_mean` — Mean execution duration in minutes
2. `stage_processing_std` — Execution duration standard deviation
3. `stage_waiting_mean` — Mean queue wait time before stage
4. `stage_waiting_std` — Queue wait standard deviation
5. `processing_contribution` — Percentage share of total process processing time (0–100)
6. `waiting_contribution` — Percentage share of total process waiting time (0–100)
7. `event_volume` — Total events processed by stage
8. `resource_load` — Average events per unique resource
9. `queue_length` — Backlog accumulation metric
10. `peak_hour_load` — Fraction of events processed during surge hours
11. `cycle_time` — Process-wide mean cycle time
12. `processing_time` — Stage total processing time
13. `waiting_time` — Stage total waiting time
14. `process_efficiency` — Processing time / (Processing + Waiting) ratio
15. `upstream_delay` — Mean transfer wait time entering this stage
16. `downstream_delay` — Mean transfer wait time leaving this stage
17. `priority_mix` — Proportion of high/urgent priority items
18. `rework_frequency` — Frequency of repeat stage visits
19. `stage_frequency` — Fraction of total cases visiting this stage

---

## Models & Evaluation

The models are trained on 20,000 synthetic cases across 8 operational patterns:
- Waiting Bottleneck
- Processing Bottleneck
- Resource Starvation
- High Variability
- High Volume Backpressure
- Peak-Period Concentration
- Competing Bottlenecks
- Bottleneck Migration

### Performance Metrics (from `artifacts/evaluation_report.json`)

| Model | Algorithm | Primary Metric | Result |
| :--- | :--- | :--- | :--- |
| **Bottleneck Forecaster** | `RandomForestClassifier` | ROC-AUC / Test F1 | **1.0000** |
| **Anomaly Detector** | `IsolationForest` | ROC-AUC / Test Precision | **0.9861 / 0.838** |
| **Remaining Time Predictor** | `RandomForestRegressor` | Test R² / MAE | **0.7077 / 51.3 min** |

---

## API Endpoints

- `GET /health` — Service and loaded model health status
- `GET /metrics` — Live evaluation metrics report
- `POST /predict/bottleneck` — Predicts next stage bottleneck with calibrated probabilities and feature signals
- `POST /predict/anomaly` — Unsupervised detection of anomalous case executions with severity and signals
- `POST /predict/remaining-time` — Predicts remaining case duration with 80% confidence interval
- `POST /predict/all` — High-efficiency single-pass unified predictions
- `POST /predict/intervention` — Synthesizes deterministic What-If intervention with ML bottleneck migration forecast

---

## Local Setup & Execution

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Retrain models (optional; pre-trained weights in artifacts/)
python training/train_models.py

# 3. Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# 4. Run test suite
pytest tests/
```
