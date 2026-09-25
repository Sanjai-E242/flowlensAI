# FlowLens AI — Universal Process Intelligence Platform

> **Deterministic Process Mining + Predictive Machine Learning + What-If Simulation + Gemini AI Explanation**
> 
> FlowLens AI transforms event-log data into operational foresight across Healthcare, Financial Services, Supply Chain, Logistics, and Manufacturing.

---

## Architecture Formula

```
FlowLens AI
=
Deterministic Process Intelligence   [what is happening]
+
Predictive Machine Learning          [what is likely to happen]
+
What-If Simulation                   [what may happen after intervention]
+
Gemini AI Explanation                [explains verified evidence]
```

### The Four Analytical Tiers

1. **DETERMINISTIC ENGINE (What is happening)**
   - Single source of truth for observed historical metrics.
   - Calculates exact cycle times, processing durations, inter-stage queue delays, resource utilizations, and 6-signal Bottleneck DNA.
   - 100% deterministic TypeScript mathematics — zero hallucination, zero black-box assumptions.

2. **PREDICTIVE MACHINE LEARNING (What is likely to happen)**
   - Scikit-learn models trained on stage transitions, queue dynamics, and resource load features.
   - **Bottleneck Forecaster (`RandomForestClassifier`)**: Predicts the probability of upcoming stage congestion and estimated hours until bottleneck emergence.
   - **Anomaly Detector (`IsolationForest`)**: Unsupervised anomaly detection scoring execution deviations, unusual transitions, and queue inflation.
   - **Remaining-Time Predictor (`RandomForestRegressor`)**: Predicts remaining case cycle duration with 95% confidence intervals based on current stage and elapsed progress.
   - *Note:* ML models predict statistical likelihoods based on historical patterns; they do not assert deterministic causality.

3. **WHAT-IF SIMULATION (What may happen after intervention)**
   - Counterfactual modeling grounded in Kingman's formula for queue congestion.
   - Evaluates resource reallocation, capacity expansion, and arrival rate changes.
   - Predicts bottleneck migration across 5 structural transition patterns.

4. **GEMINI AI EXPLANATION (Explains verified evidence)**
   - Grounded executive narrative generation powered by Google Gemini (`@google/genai`).
   - Strictly consumes structured JSON evidence (`AIStructuredEvidence`) containing verified deterministic metrics and ML predictions.
   - Gemini never calculates numbers; it interprets verified facts into strategic business insights with clear assumption disclaimers.

---

## Tech Stack

| Tier | Component | Technology |
|---|---|---|
| **Frontend & Orchestration** | Web Application | Next.js 16 (App Router, React 19, TypeScript Strict) |
| | Styling & UI | Tailwind CSS v4, Lucide Icons |
| | Visualization | SVG Process Flow Graphs, Interactive Sliders, Metrics Cards |
| **Data & State** | Persistence | Supabase (PostgreSQL + Row-Level Security) |
| **Deterministic Analytics** | Process Mining Engine | Pure TypeScript — zero dependencies, 103 test assertions |
| | Simulation Engine | Kingman Queueing Equations & Migration Classifier |
| **Machine Learning Service** | Microservice Framework | Python 3.12 + FastAPI + Uvicorn |
| | ML Models | Scikit-learn (`RandomForestClassifier`, `IsolationForest`, `RandomForestRegressor`) |
| | Feature Engineering | Pandas, NumPy (one-hot encoding, stage elapsed tracking, rolling queues) |
| **Generative AI** | Executive Narration | Google Gemini API (`@google/genai`) |
| **Verification & Quality** | Test Suites | `pytest` (10 Python tests) + `npm test` (103 TypeScript assertions) |

---

## End-to-End System Pipeline

```
Raw Process Event Log (CSV)
   │
   ▼
[ Tier 1: Deterministic Engine ]
   ├── Case Chronology Reconstruction
   ├── Stage Analytics (mean, median, p95, stdev)
   ├── Inter-Stage Transition & Queue Wait Analysis
   └── Bottleneck DNA Scoring (0.4 × Processing + 0.6 × Queue Waiting)
   │
   ├───► [ Tier 2: Predictive Machine Learning Service ]
   │        ├── Bottleneck Forecaster (Congestion probability & ETA)
   │        ├── Anomaly Detector (IsolationForest outlier scoring)
   │        └── Remaining Time Predictor (Expected duration + CI)
   │
   ├───► [ Tier 3: What-If Simulation Engine ]
   │        ├── Kingman G/G/c Queue Congestion Modeling
   │        ├── Capacity & Arrival Rate Perturbation
   │        └── 5-Pattern Bottleneck Migration Detection
   │
   └───► [ Tier 4: Gemini AI Narration Layer ]
            ├── Verified Evidence Assembly (AIStructuredEvidence)
            ├── Role-conditioned Executive Synthesis
            └── Deterministic Fallback Guaranteed
   │
   ▼
Unified Executive Dashboard (Vercel-hosted)
```

---

## Project Structure

```
flowlens-ai/
├── ml-service/                     # Python FastAPI Machine Learning Microservice
│   ├── app.py                      # FastAPI server & route handlers
│   ├── features/                   # Feature engineering & tabular transformations
│   ├── models/                     # Model wrappers (forecaster, anomaly, remaining-time)
│   ├── training/                   # Model training pipeline & hyperparameter tuning
│   ├── inference/                  # Low-latency inference engine
│   ├── artifacts/                  # Serialized .joblib model binaries & feature metadata
│   ├── tests/                      # pytest test suite
│   └── requirements.txt            # Python dependencies
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── datasets/analyze/   # Deterministic process mining endpoint
│   │   │   ├── simulation/         # What-If simulation endpoints
│   │   │   ├── ai/explain/         # Gemini explanation endpoint
│   │   │   └── ml/                 # Next.js ML proxy routes
│   │   │       ├── predict/        # Full predictive bundle
│   │   │       ├── bottleneck-forecast/
│   │   │       ├── anomaly/
│   │   │       ├── remaining-time/
│   │   │       └── intervention/   # Model-guided optimization
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── backend/
│   │   ├── engine/                 # Deterministic event log engine
│   │   ├── simulation/             # Kingman congestion & migration simulator
│   │   ├── ai/                     # Gemini evidence builder & explainer
│   │   ├── ml/                     # ML client connector & offline fallback generator
│   │   └── database/               # Supabase client & schemas
│   ├── frontend/
│   │   └── components/
│   │       ├── dashboard/          # Executive dashboard views
│   │       ├── ml/                 # Predictive Intelligence Dashboard Panel
│   │       ├── simulation/         # What-If Simulator Panel
│   │       └── ai/                 # Gemini AI Explanation Panel
│   └── shared/types/               # TypeScript interfaces (process, simulation, ML, AI)
├── scripts/
│   └── test-engine.ts              # Deterministic & simulation assertion suites
├── docs/                           # Technical documentation & architecture specs
├── .env.example                    # Environment variable template
└── README.md
```

---

## Deployment Architecture

### Dual-Service Architecture

FlowLens AI is built as a cloud-native decoupled architecture:

1. **Next.js Web Application (Deploy to Vercel)**:
   - Houses the user interface, deterministic analytics engine, What-If simulation, Supabase integration, and Gemini AI narrative.
   - Deploys seamlessly to Vercel with zero external build dependencies.

2. **Python FastAPI ML Service (Containerized Microservice)**:
   - Houses the scikit-learn models and high-throughput inference endpoints.
   - Deploys to any container platform (Docker, Google Cloud Run, Railway, Render, AWS ECS).
   - Configured in Next.js via the `ML_SERVICE_URL` environment variable.

### Graceful Offline Fallback

The Next.js application **never** requires the Python service to remain functional:
- If `ML_SERVICE_URL` is omitted, unreachable, or cold-starting, the Next.js ML client automatically detects the service state and transitions to a **deterministic statistical fallback mode**.
- Fallback predictions are computed directly in TypeScript from verified historical distributions, tagging all outputs with `source: "heuristic_fallback"`.
- The Vercel deployment remains 100% operational with full dashboard, simulation, and Gemini narrative capabilities.

---

## Setup & Local Development

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (for ML service)
- Supabase Project (optional for persistence)
- Google Gemini API Key (for executive narration)

### 2. Next.js Web Application Setup

```bash
git clone https://github.com/pranav241801205/flowlens-ai.git
cd flowlens-ai
npm install
```

Configure `.env.local`:
```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Python ML Microservice (Optional - defaults to offline fallback if omitted)
ML_SERVICE_URL=http://127.0.0.1:8000
```

Run Next.js:
```bash
npm run dev
```

### 3. Python ML Microservice Setup (Optional)

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

---

## Verification & Testing

Run the full verification suite across both TypeScript and Python:

```bash
# 1. Deterministic Process Engine Tests (103 assertions across 25 suites)
npm run test

# 2. Python ML Microservice Tests
cd ml-service && pytest tests/ && cd ..

# 3. TypeScript Typecheck
npx tsc --noEmit

# 4. ESLint Static Analysis
npm run lint

# 5. Production Next.js Build
npm run build
```

---

## API Reference

### Process Mining & Simulation
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and service connectivity heartbeat |
| `POST` | `/api/datasets/analyze` | Ingests CSV event log, returns full deterministic analysis |
| `POST` | `/api/simulation` | Runs a single Kingman What-If parameter intervention |
| `POST` | `/api/simulation/compare` | Compares multiple intervention scenarios side-by-side |
| `POST` | `/api/ai/explain` | Generates Gemini AI executive explanation from structured evidence |

### Machine Learning Endpoints
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ml/predict` | Returns complete predictive package (forecast + anomalies + durations) |
| `POST` | `/api/ml/bottleneck-forecast` | Predicts stage congestion likelihood and hours to bottleneck |
| `POST` | `/api/ml/anomaly` | IsolationForest anomaly scoring for active process cases |
| `POST` | `/api/ml/remaining-time` | Predicts expected remaining cycle duration with 95% CI |
| `POST` | `/api/ml/intervention` | Generates model-guided capacity and routing recommendations |

---

## Security & Compliance

- **No Secrets in Client Bundles**: API keys (`GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`) are restricted to server-side execution.
- **Row Level Security**: Supabase tables enforce strict tenant isolation and read protections.
- **Evidence Sanitization**: Pre-prompt sanitizers strip sensitive values before submitting context to LLM models.
- **Git Hygiene**: Environment files (`.env`, `.env.local`, `.env.*.local`) and model training caches are untracked.

---

## License

MIT © FlowLens AI
