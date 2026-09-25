# FlowLens AI — Process Intelligence & Bottleneck Detection

> **Deterministic process mining + Gemini AI explanations.**
> Upload a process event log → find the bottleneck → simulate interventions → get AI-narrated executive insights.

---

## What It Does

FlowLens AI is a full-stack process intelligence platform that answers four operational questions in sequence:

| Question | Capability |
|---|---|
| **Where is the process slowing down?** | Bottleneck DNA detection with 6 evidence signals |
| **Why is it slowing down?** | Root-cause attribution (resource overload, queue build-up, peak periods) |
| **What happens if we intervene?** | What-If simulator with Kingman queue-congestion math |
| **What does it mean in plain language?** | Gemini AI executive narration — grounded in verified deterministic evidence |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Row Level Security) |
| AI Narration | Google Gemini API (`@google/genai`) |
| Analytics Engine | Pure TypeScript — zero ML, 100% deterministic |
| Testing | 99 assertions across 25 test suites |

---

## Architecture

```
CSV Upload
   ↓
Case Reconstruction (chronological, inter-stage waiting)
   ↓
Stage Analytics (mean, median, std dev, cycle contribution)
   ↓
Bottleneck DNA Model  ← 0.4 × processing + 0.6 × waiting contribution
   ↓
Root Cause Attribution (resource load, transitions, peak periods)
   ↓
What-If Simulator  ← Kingman queue congestion equations (deterministic)
   ↓
Bottleneck Migration Engine  ← 5-pattern detection
   ↓
Gemini Evidence Builder  ← structured evidence, zero free-form numbers
   ↓
Gemini AI Narration  ← executive summary, deterministic fallback guaranteed
   ↓
Interactive Dashboard  ← 7 sections, staggered animations, Supabase persistence
```

**Key architectural rule:** Gemini **never** calculates metrics. It receives a verified `AIStructuredEvidence` contract and converts it to plain language.

---

## Project Structure

```
src/
├── app/            # Next.js routes & pages
├── frontend/       # React components (browser-safe)
├── backend/
│   ├── engine/     # Deterministic process mining pipeline
│   ├── simulation/ # What-If & Kingman simulator
│   ├── ai/         # Gemini evidence builder + explainer
│   └── database/   # Supabase server-only client
├── shared/types/   # TypeScript contracts (process, simulation, AI)
└── data/           # Synthetic benchmark dataset
```

---

## Demo Flow (for judges)

1. **Load demo dataset** — click "Load Demo" in the top nav  
   The benchmark CSV contains a hidden queue bottleneck at **Verification** (score 62.5)

2. **Inspect the bottleneck** — the dashboard automatically ranks stages  
   Verification shows `WAITING` as primary DNA factor with 94.2% queue contribution

3. **Run a What-If simulation** — scroll to the simulator panel  
   Try **"+2 Resources to Verification"** — cycle time drops 64%, bottleneck migrates to Review

4. **Read the AI explanation** — click "Generate AI Explanation"  
   Gemini produces a grounded executive narrative with assumptions and limitations

5. **Upload your own CSV** — click "Upload CSV"  
   Format: `case_id, activity, start_time, end_time` (ISO 8601 timestamps, aliases accepted)

---

## CSV Format

```csv
case_id,activity,start_time,end_time,resource_id
CASE-001,Intake,2024-01-15T08:00:00Z,2024-01-15T08:30:00Z,Alice
CASE-001,Review,2024-01-15T09:00:00Z,2024-01-15T10:00:00Z,Bob
```

**Accepted column aliases:** `case`, `id`, `case_id` / `activity`, `task`, `stage` / `start`, `start_time`, `timestamp` / `end`, `end_time`, `complete_time` / `resource`, `resource_id`, `performer`

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- Google Gemini API key

### Installation

```bash
git clone <repo-url>
cd flowlens-ai
npm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Run

```bash
npm run dev        # Development server
npm run test       # 99-assertion test suite
npm run build      # Production build
npm run lint       # ESLint
```

---

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | System heartbeat |
| `POST` | `/api/datasets/analyze` | Analyze CSV, optionally persist to Supabase |
| `POST` | `/api/simulation` | Run a single What-If scenario |
| `POST` | `/api/simulation/compare` | Compare multiple scenarios in parallel |
| `POST` | `/api/ai/explain` | Generate Gemini AI explanation |
| `POST` | `/api/ai/executive-summary` | Generate executive summary only |

---

## Metric Definitions

| Metric | Scope | Formula |
|---|---|---|
| **Avg Case Cycle Time** | Process-level | avg( end_last_stage − start_first_stage ) per case |
| **Avg Case Processing** | Process-level | avg( Σ processing durations ) per case |
| **Avg Case Waiting** | Process-level | Cycle − Processing per case |
| **Stage Queue Wait** | Stage-level | avg( stage_start − prev_stage_end ) per event |
| **Bottleneck Score** | Stage-level | 0.4 × proc_contribution% + 0.6 × wait_contribution% |

> **Invariant:** Avg Case Cycle Time = Avg Case Processing + Avg Case Waiting (enforced in 99 test assertions)

---

## Test Coverage

```
Suite  1: CSV Parser & Header Normalization
Suite  2: Timestamp Parsing & Duration Formatting
Suite  3: Case Reconstruction
Suite  4: Stage Analytics
Suite  5: Bottleneck Scoring & DNA
Suite  6: Resource Analytics
Suite  7: Peak Analytics
Suite  8: Transition Queue Mapping
Suite  9: Root Cause Attribution
Suite 10: End-to-End analyzeProcess()
Suite 11: Synthetic Hidden-Bottleneck Dataset
Suite 12-16: Simulation Math (Kingman, queue relief, migration)
Suite 17-20: Bottleneck Migration Patterns
Suite 21: Metric Consistency (cycle = proc + wait)
Suite 22-23: AI Evidence Contract
Suite 24: Gemini Explainer (mocked)
Suite 25: Phase 4.1 AI Evidence Consistency Audit

Total: 99/99 assertions passing
```

---

## Security

- `GEMINI_API_KEY` and `SUPABASE_SECRET_KEY` are server-only; runtime guards prevent browser access
- `NEXT_PUBLIC_*` variables contain only publishable (anon) keys
- `.env.local` is gitignored
- Supabase RLS enabled; anonymous reads blocked on all tables
- Gemini response sanitizer strips any accidental credential leakage

---

## License

MIT
