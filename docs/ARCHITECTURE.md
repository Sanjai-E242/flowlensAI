# FlowLens AI — System Architecture & Layer Specifications

## Architectural Overview

FlowLens AI is engineered as a clean, decoupled process intelligence platform. It maintains strict physical and logical boundaries between presentation, backend analytical engines, database persistence, AI orchestration, and shared type contracts.

```
                      ┌────────────────────────────────────────┐
                      │              CSV Log File              │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │         Frontend Upload Layer          │
                      │  (Drag & Drop, CSV Parser, UI State)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          Next.js API Gateway           │
                      │      (/api/datasets/analyze, /health)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       Backend Algorithmic Engine       │
                      │  (Case Reconstruction, Time Metrics)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │         Bottleneck Intelligence        │
                      │  (Contribution Model, Bottleneck DNA)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │         Root Cause Attribution         │
                      │  (Transitions, Peaks, Performer Load)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │        Interactive 2D Dashboard        │
                      │   (Topology, Telemetry, Comparisons)   │
                      └────────────────────────────────────────┘

              Future Phase 3 Extension:
              ┌────────────────────────────────────────┐
              │           Backend Simulation           │
              │  (Discrete-Event What-If Simulator)    │
              └───────────────────┬────────────────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────────┐
              │         Intervention Modeling          │
              │   (Capacity Tuning, Queue Mitigation)  │
              └───────────────────┬────────────────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────────┐
              │      Bottleneck Migration Engine       │
              │     (Downstream Shift Identification)  │
              └───────────────────┬────────────────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────────┐
              │         Gemini Explanation Layer       │
              │ (Executive Narration & Recommendations)│
              └────────────────────────────────────────┘
```

---

## Directory Hierarchy

```
src/
├── app/                        # Next.js App Router (Routing, Layouts, API Handlers)
│   ├── page.tsx                # Master Dashboard view entrypoint
│   ├── layout.tsx              # Root HTML/CSS layout and typography
│   ├── globals.css             # Tailwind v4 directives, animations & beacons
│   └── api/                    # Server-side API endpoints
│       ├── health/             # Health check endpoint (/api/health)
│       └── datasets/
│           └── analyze/        # Process analysis & ingestion endpoint (/api/datasets/analyze)
│
├── frontend/                   # Browser-safe client presentation layer
│   ├── components/
│   │   ├── dashboard/          # Process intelligence dashboard widgets
│   │   │   ├── TopNav.tsx
│   │   │   ├── ProcessOverviewCards.tsx
│   │   │   ├── ProcessFlowGraph.tsx
│   │   │   ├── BottleneckIntelligencePanel.tsx
│   │   │   ├── StageComparisonChart.tsx
│   │   │   ├── ResourceIntelligencePanel.tsx
│   │   │   ├── PeakAnalysisPanel.tsx
│   │   │   ├── InteractiveFilters.tsx
│   │   │   └── DashboardMain.tsx
│   │   └── upload/             # Ingestion & file upload modal components
│   │       ├── DatasetUploadModal.tsx
│   │       └── ProcessEngineTester.tsx
│   └── hooks/                  # Custom UI and state hooks
│
├── backend/                    # Server-side domain intelligence & business logic
│   ├── engine/                 # Deterministic process mining pipeline
│   │   ├── csv-parser.ts       # RFC 4180 quote-aware tokenizer & header normalizer
│   │   ├── validator.ts        # Row-level timestamp and sequence validator
│   │   ├── case-reconstruction.ts # Chronological case builder & overlap detector
│   │   ├── stage-analytics.ts  # Mean, median, min, max, std dev aggregators
│   │   ├── bottleneck-model.ts # 0.4 proc + 0.6 wait contribution & Bottleneck DNA
│   │   ├── resource-analytics.ts # Performer workload share & overload detector
│   │   ├── peak-analytics.ts   # 24-hour temporal bucketing (>= 1.2x threshold)
│   │   ├── transitions.ts      # Stage-to-stage transition queue analytics
│   │   ├── root-cause.ts       # Structured evidence & LLM explanation payloads
│   │   ├── time-utils.ts       # Deterministic timestamp parser & duration formatters
│   │   ├── constants.ts        # Canonical aliases & analytical thresholds
│   │   └── index.ts            # Central analyzeProcess() service
│   ├── database/               # Server-side Supabase persistence layer
│   │   ├── data-access.ts      # Dataset & event persistence routines
│   │   ├── server.ts           # Server-only client using SUPABASE_SECRET_KEY
│   │   ├── client.ts           # Browser-safe Supabase client (publishable key only)
│   │   ├── types.ts            # Schema types re-export
│   │   └── index.ts            # Database layer barrel export
│   ├── simulation/             # Reserved for Phase 3: Discrete-Event Simulator
│   │   └── index.ts
│   └── ai/                     # Server-side Gemini LLM abstraction layer
│       ├── gemini.ts           # Server-only GoogleGenAI client (GEMINI_API_KEY)
│       └── index.ts            # AI layer barrel export
│
├── shared/                     # Cross-boundary contracts (Browser & Server safe)
│   ├── types/                  # Canonical process & database interface definitions
│   │   ├── process.ts          # EventRecord, NormalizedEvent, BottleneckCandidate, etc.
│   │   ├── database.ts         # Database table schema interfaces
│   │   └── index.ts            # Types barrel export
│   ├── constants/              # Shared constants & alias definitions
│   └── utils/                  # Shared formatting & math helpers
│
└── data/                       # Deterministic test & benchmark datasets
    ├── synthetic-dataset.ts    # TypeScript benchmark exports
    └── synthetic-hidden-bottleneck.csv # 50-event queue bottleneck test dataset
```

---

## Layer Responsibilities & Security Boundaries

### 1. Frontend Layer (`src/frontend/`)
- Contains purely browser-safe React components and custom hooks.
- Never directly imports database secret keys or server credentials (`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`).
- Communicates with backend logic strictly through the Next.js API route layer.
- Handles user interactions, visual transitions, state memoization, and responsive layout.

### 2. API Layer (`src/app/api/`)
- Next.js Route Handlers executing strictly on the Node.js server.
- `POST /api/datasets/analyze`: Accepts CSV input via JSON body or multipart upload, executes the deterministic backend engine, optionally persists records to Supabase, and returns complete structured analysis.
- `GET /api/health`: Provides system heartbeat and active phase telemetry without leaking configuration details.

### 3. Backend Intelligence Layer (`src/backend/engine/`)
- Pure algorithmic logic completely decoupled from React and browser DOM APIs.
- Operates deterministically: given identical event inputs, it produces bit-for-bit identical outputs without machine learning unpredictability.
- Evaluates the 6 Bottleneck DNA signals (`WAITING`, `PROCESSING`, `VARIABILITY`, `VOLUME`, `RESOURCE`, `PEAK`).
- Identifies queue sources via sequential stage transitions ($A \to B$) and generates non-causal (*"associated with"*) root-cause attributions.

### 4. Database Layer (`src/backend/database/`)
- Encapsulates Supabase PostgreSQL database access.
- `server.ts` uses `SUPABASE_SECRET_KEY` with a hard runtime guard preventing browser execution.
- Tables `datasets` and `process_events` have Row Level Security (RLS) enabled; public anonymous reads are disabled. All operational access routes through service-role policies in server-side data access functions.

### 5. AI Layer (`src/backend/ai/`)
- Houses the server-only Google Gemini client (`@google/genai`).
- Enforces strict isolation: Gemini is never used to compute process mining metrics. It is reserved for future natural language narration and executive explanation of the deterministic engine's structured evidence payloads.

### 6. Shared Contracts (`src/shared/`)
- Central source of truth for TypeScript types, canonical interfaces, and universal formatters.
- Guaranteed safe for import in both client-side components and server-side engine modules.

---

## Data Flow Pipeline

```
1. Raw CSV Ingestion (Frontend or API)
   ↓
2. Header Tokenization & Canonical Alias Matching (case_id, activity, start_time, end_time, resource_id)
   ↓
3. Row-Level Integrity Validation & Deterministic Timestamp Parsing (ms epoch)
   ↓
4. Chronological Case Reconstruction (start sorting, inter-stage waiting time, overlap detection)
   ↓
5. Macro & Stage Analytics Aggregation (mean, median, min, max, std dev, cycle contribution)
   ↓
6. Sequential Transition Queue Mapping (upstream/downstream handoff delays)
   ↓
7. Temporal Peak-Time Bucketing (24-hour distribution, >= 120% surge threshold)
   ↓
8. Resource Workload Distribution (workload share %, concentration, overload signals)
   ↓
9. Bottleneck Contribution Model (0.4 proc + 0.6 wait) & Bottleneck DNA Evaluation
   ↓
10. Root Cause Attribution & LLM-Ready Explanation Payload Generation
   ↓
11. Interactive Presentation (2D Topology, Telemetry Inspector, Comparative Charts)
```
