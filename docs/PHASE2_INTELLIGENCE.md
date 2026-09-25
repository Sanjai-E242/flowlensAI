# FlowLens AI — Phase 2: Bottleneck DNA Intelligence & Root Cause Attribution

## Overview
Phase 2 transforms FlowLens AI from a raw deterministic calculation pipeline into an explainable process-intelligence dashboard. It integrates:
1. **Extended Bottleneck DNA**: Deterministic evaluation of `WAITING`, `PROCESSING`, `VARIABILITY`, `VOLUME`, `RESOURCE`, and `PEAK` factors.
2. **Resource Intelligence**: Performer workload share %, concentration detection, and transparent overload signals with non-causal (*"associated with"*) phrasing.
3. **Peak-Time Analytics**: 24-hour temporal bucketing identifying traffic surges ($\ge 120\%$ threshold).
4. **Stage Transitions**: Upstream and downstream queue formation tracking.
5. **Deterministic Root Cause Attribution & Explanation Payloads**: Structured, metric-grounded evidence formatted for future Gemini explanation layers without using an LLM in Phase 2.
6. **Futuristic Interactive 2D Dashboard**: Sequential topology graph with animated flow particles, telemetry inspector, comparative processing vs. waiting charts, and one-click demo dataset loading.

---

## 1. Bottleneck DNA Factor Definitions

| Signal | Mathematical Criterion | Tag |
| :--- | :--- | :--- |
| **`WAITING`** | Waiting share $\ge 25.0\%$ of system wait **OR** total wait $\ge 1.5\times$ total execution duration | *Queue Congestion* |
| **`PROCESSING`**| Processing share $\ge 25.0\%$ of system active work time | *Prolonged Execution* |
| **`VARIABILITY`** | Coefficient of variation ($\sigma / \mu$) $\ge 0.60$ | *Unstable Cycle Times* |
| **`VOLUME`** | Event count $\ge 1.30\times$ average stage transaction volume | *High Event Frequency* |
| **`RESOURCE`** | Associated with performer whose workload $\ge 1.35\times$ average resource load **OR** stage concentration $\ge 50\%$ | *Resource Constraint* |
| **`PEAK`** | $\ge 30\%$ of stage events occur during detected operational peak windows | *Peak Concentration* |

---

## 2. Resource Overload Attribution
- **Language Standard**: Strict adherence to non-causal wording (*"associated with"*) to avoid unwarranted operator blame before human operator review.
- **Overload Thresholds**:
  - `OVERLOAD_WORKLOAD_RATIO`: $1.40\times$ (140% of average resource duration across the dataset).
  - `STAGE_CONCENTRATION_PCT`: $\ge 50.0\%$ of all executions in a stage handled by a single performer.
  - `HIGH_CASE_SHARE_PCT`: $\ge 35.0\%$ of all cases touched by one resource.

---

## 3. Peak-Time Analysis Model
- Analyzes start timestamps across 24 hourly buckets ($00:00$ to $23:00$ UTC).
- **Peak Threshold**: Hourly event volume $\ge 120\%$ ($1.2\times$) of mean hourly volume across active hours.
- Identifies dominant case intake windows and associates queue accumulation with arrival surges.

---

## 4. Stage Transition Graph
- Reconstructs case-by-case sequential handoffs ($A \to B$).
- Accurately captures inter-stage handoff queue stalls ($\text{start}_{B} - \text{end}_{A}$).
- Proves in the synthetic dataset that the handoff $\text{Intake} \to \text{Verification}$ is where $>90\%$ of process waiting accumulates.

---

## 5. Security & RLS Posture
- Supabase RLS is hardened: broad public-read access policies have been revoked; server-side queries execute exclusively through `service_role` (`SUPABASE_SECRET_KEY`).
- Secret keys remain server-only; zero leakage into client-side JavaScript bundles.
- `.env.example` contains variable names only; `.env.local` is gitignored.

---

## 6. Demo Scenario: "Longest Stage ≠ Dominant Bottleneck"
- **Stage Review**: Longest individual processing time (60m avg, 60% of all processing work), but only 2.3% of waiting time.
- **Stage Verification**: Short processing duration (15m avg), but accumulates ~200m average queue delay (>90% of entire system wait).
- **Result**: FlowLens AI ranks `Verification` as the **#1 Dominant Bottleneck (Score: 62.5)** with Bottleneck DNA `WAITING` (*Queue Congestion*), while `Review` ranks **#2 (Score: 25.4)** with Bottleneck DNA `PROCESSING` (*Prolonged Execution*).
