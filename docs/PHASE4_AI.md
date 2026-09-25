# FlowLens AI — Phase 4: Gemini AI Explanation Layer

## Overview

Phase 4 adds a controlled AI narration layer on top of the fully deterministic Phase 1/2/3 engine. Gemini AI explains results — it **never calculates them**.

---

## Architectural Invariant

```
Deterministic Engine  →  AIStructuredEvidence  →  Gemini Prompt  →  AI Narration
        ↑                        ↑                      ↑                 ↑
  Phase 1/2/3              Zero secrets,          Metric rules      Plain language
  (all numbers)           verified metrics         enforced         output only
```

---

## Evidence Contract (`AIStructuredEvidence`)

### Process Baseline (Global Source of Truth)

```ts
processBaseline: {
  avgCaseCycleTime: string;           // e.g. "6h"
  avgCaseProcessingTime: string;      // e.g. "1h 40m"
  avgCaseWaitingTime: string;         // e.g. "4h 20m"
  totalProcessWaitingTime: string;    // e.g. "1d 19h"
  totalProcessProcessingTime: string; // e.g. "16h 40m"
}
```

**Invariant enforced in tests:** `avgCaseCycleTime = avgCaseProcessingTime + avgCaseWaitingTime`

### Bottleneck (Stage-Specific Metrics)

```ts
bottleneck: {
  stage: string;                         // "Verification"
  score: number;                         // 62.5
  stageSpecificAvgProcessingTime: string; // "15m" (Verification only)
  stageSpecificAvgWaitingTime: string;    // "4h 5m" (Verification queue wait)
  stageQueueWaitLabel: string;            // "Verification Average Queue Wait"
  stageProcessingLabel: string;           // "Verification Average Processing Duration"
}
```

---

## Metric Disambiguation (Phase 4.1 Audit)

The following two metrics appear similar but are **strictly different**:

| Metric | Value | Scope |
|---|---|---|
| Process Average Case Waiting | **4h 20m** | All stages, average per case |
| Verification Average Queue Wait | **4h 5m** | Verification stage queue only |

**Why they differ:** The process average (4h 20m) is derived by averaging `(cycle − processing)` per case across all 10 cases. The stage queue wait (4h 5m) is the mean inter-stage gap observed specifically at the Verification handoff across all 10 events at that stage.

**How they relate:** Verification's queue wait (4h 5m × 10 events) accounts for 94.2% of total process waiting time (4h 20m × 10 cases average).

---

## Prompt Safety Rules

The following rules are injected into every Gemini system prompt:

1. Use **only the numbers explicitly provided** — never calculate, estimate, or extrapolate
2. `avgCaseWaitingTime` in `processBaseline` = **process-level** average; never confuse with stage queue wait
3. Stage queue wait (`stageSpecificAvgWaitingTime`) applies only to the named bottleneck stage
4. All simulation outcomes are **projected** (simulated), not real — use "simulated", "projected", "modeled"
5. Bottleneck migration is a **simulation scenario outcome**, not a guaranteed real-world consequence
6. Use **"associated with"** rather than **"caused by"** for resource/peak attributions

---

## API Endpoints

### `POST /api/ai/explain`

Returns full explanation with bottleneck, simulation, and migration analysis.

**Request:**
```json
{
  "analysis": { "...ProcessAnalysisResult..." },
  "simulation": { "...SimulationResult or null..." },
  "targetStage": "Verification"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": { "summary": "...", "bottleneckExplanation": "...", "evidence": [...] },
  "detailedBottleneck": { "stage": "Verification", "headline": "...", "narrative": "..." },
  "detailedSimulation": { "headline": "...", "narrative": "..." },
  "detailedMigration": { "detected": true, "pattern": "MIGRATED_TO_ANOTHER_STAGE", ... },
  "executiveSummary": { "headline": "...", "processSlowingStage": "...", ... },
  "metadata": { "model": "gemini-2.0-flash", "isSimulated": false }
}
```

### `POST /api/ai/executive-summary`

Lightweight endpoint — returns only the executive summary block.

---

## Deterministic Fallback

If the Gemini API is unavailable (key missing, rate limit, timeout), the system automatically falls back to deterministic string-interpolation using the same `AIStructuredEvidence` contract. The dashboard always renders — AI explanations never block the core analytics.

---

## Response Validation

All Gemini responses are:
1. **Sanitized** — API keys are scrubbed from any accidental leakage in response text
2. **JSON-validated** — markdown code fences stripped before parsing
3. **Field-checked** — required fields are verified; missing fields trigger structured fallback
4. **Length-bounded** — executive summaries validated against 150–200 word target

---

## Test Coverage (Suites 22–25)

| Suite | Description |
|---|---|
| Suite 22 | Evidence contract structure and field presence |
| Suite 23 | Gemini client initialization and error handling |
| Suite 24 | Mocked AI explanations — terminology checks |
| Suite 25 | Phase 4.1 audit: process baseline vs stage queue metric disambiguation |

**99/99 assertions passing** including all Phase 4 suites.
