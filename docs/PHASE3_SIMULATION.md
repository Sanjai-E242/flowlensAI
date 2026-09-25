# FlowLens AI — Phase 3: What-If Intervention Simulator & Bottleneck Migration Engine

## Executive Overview

Phase 3 elevates FlowLens AI from retrospective diagnostic intelligence ("Where did the process slow down?") to prospective operational simulation ("If we change capacity or cycle times here, what happens to system-wide lead time and where does the bottleneck migrate?").

All simulation calculations are **strictly deterministic, transparent, and grounded in operations research and queueing theory**. No large language models (LLMs) are used for calculations.

---

## 1. Simulation Mathematical Engine

### A. Resource Increase & Queue Elasticity Model
When capacity (headcount or processing units) is added to a process stage, queue waiting time does not drop linearly; in saturated systems, waiting time collapses exponentially as utilization moves away from 1.0.

FlowLens AI implements an empirical **Kingman queue congestion model**:
1. **Current Observed Resources ($C_{base}$)**: Number of unique active resources assigned to the target stage ($\ge 1$).
2. **Simulated Capacity ($C_{sim}$)**: $C_{base} + \Delta C$, where $\Delta C$ is additional resources ($\ge 1$).
3. **Queue Utilization Proxy ($\rho_0$)**: Derived directly from the stage's empirical waiting contribution percentage:
   $$\rho_0 = \min(0.95, \max(0.40, \frac{\text{waitingContributionPct}}{100}))$$
4. **Simulated Utilization ($\rho_{sim}$)**:
   $$\rho_{sim} = \rho_0 \times \left(\frac{C_{base}}{C_{sim}}\right)$$
5. **Kingman Delay Factor Ratio**:
   $$\text{DelayRatio} = \frac{\rho_{sim} / (1 - \rho_{sim})}{\rho_0 / (1 - \rho_0)}$$
   Bounded with a non-zero residual floor ($\ge 5\%$) representing transit and routing handoff overhead:
   $$W_{sim} = W_{orig} \times \max(0.05, \min(1.0, \text{DelayRatio}))$$

### B. Processing Time Reduction Model
Models operational automation, tooling enhancements, or template standardization:
$$P_{sim} = P_{orig} \times (1 - \frac{\text{reductionPercent}}{100})$$
Where $\text{reductionPercent} \in [1, 90]$. Proportional scaling is applied to mean, median, min, max, and standard deviation.

### C. Queue Reduction Model
Models operational triage, priority routing, or batch size reductions:
$$W_{sim} = W_{orig} \times (1 - \frac{\text{reductionPercent}}{100})$$
Where $\text{reductionPercent} \in [1, 90]$.

---

## 2. Process-Wide Lead Time & Bottleneck Recalculation

After stage metrics are adjusted:
1. **Total Process Processing Time**: $\sum P_{sim}$ across all stages.
2. **Total Process Waiting Time**: $\sum W_{sim}$ across all stages.
3. **Total Process Lead Time**: $T_{lead} = \sum P_{sim} + \sum W_{sim}$.
4. **Average Case Cycle Time**:
   $$\Delta \text{LeadMs} = T_{lead, base} - T_{lead, sim}$$
   $$\text{SimulatedAvgCycleTimeMs} = \max(1, \text{BaselineAvgCycleTimeMs} - \frac{\Delta \text{LeadMs}}{\text{totalCases}})$$
5. **Stage Contributions**: Recalculated for each stage as share of simulated totals.
6. **Bottleneck Re-Scoring**:
   The exact same Phase 1/2 multi-factor scoring formula is evaluated:
   $$\text{DelayScore} = (0.40 \times \text{ProcessingContributionPct}) + (0.60 \times \text{WaitingContributionPct})$$
   Stages are re-ranked from 1 to $N$, and Bottleneck DNA tags are refreshed.

---

## 3. Bottleneck Migration Detection Engine

The migration engine evaluates baseline vs. simulated rankings to identify structural process shifts:

| Pattern | Detection Rule | Meaning |
|---|---|---|
| `MIGRATED_TO_ANOTHER_STAGE` | Baseline Rank 1 $\ne$ Simulated Rank 1 | Delays in the primary stage were sufficiently relieved, shifting dominant lead-time drag to a downstream/upstream stage. |
| `MULTIPLE_BOTTLENECK_CONVERGENCE` | Baseline Rank 1 remains Rank 1, but $\Delta(\text{Rank 1}, \text{Rank 2}) \le 3.0$ pts | Delays have equalized across stages, creating emerging dual bottlenecks. |
| `BOTTLENECK_IMPROVED_REMAINS_TOP` | Baseline Rank 1 remains Rank 1, and score reduced by $\ge 2.0$ pts | Significant operational improvement achieved, but stage still leads overall process delay. |
| `SAME_BOTTLENECK_REMAINS` | Baseline Rank 1 remains Rank 1, with modest reduction ($0.5$ to $2.0$ pts) | Bottleneck remains unchanged with minor relief. |
| `NO_MEANINGFUL_CHANGE` | Absolute score change $< 0.5$ pts | Simulated intervention has negligible impact on process delay profile. |

> **Terminology Note:** To maintain scientific and statistical credibility, all narratives explicitly use **"simulated bottleneck migration"** rather than claiming real-world processes *will* shift.

---

## 4. Benchmark Demonstration Outcomes

Using the canonical benchmark dataset (`src/data/synthetic-hidden-bottleneck.csv`):

### Baseline Metrics
- **Dominant Bottleneck**: `Verification` (Score: **62.5**, Primary Factor: `WAITING`, Waiting Share: **94.2%**)
- **Longest Processing Stage**: `Review` (Score: **25.1**, Duration: **1h avg**, Processing Share: **60.0%**)
- **Avg Case Cycle Time**: **5h 40m** (Total Queue Waiting: **1d 16h**)

### Intervention A: Add 1 Resource to Verification (+1 Headcount)
- **Simulated Queue Relief**: **84.4%** reduction in total waiting time
- **Simulated Cycle Time**: Drops from **5h 40m** to **2h 13m** (**61.0% improvement**)
- **Verification Score**: Drops from **62.5** down to **43.7**
- **Review Score**: Rises from **25.1** to **31.4** (relative share of process delay expands)
- **Migration Status**: `BOTTLENECK_IMPROVED_REMAINS_TOP` (Verification remains #1, but significantly relieved)

### Intervention B: Add 2 Resources to Verification (+2 Headcount)
- **Simulated Queue Relief**: **89.0%** reduction in total waiting time
- **Simulated Cycle Time**: Drops from **5h 40m** to **2h 01m** (**64.3% improvement**)
- **Verification Score**: Drops from **62.5** down to **34.3** (Rank 2)
- **Review Score**: Moves to **34.6** (Rank 1)
- **Migration Status**: `MIGRATED_TO_ANOTHER_STAGE` (**Verification $\to$ Review**)
- **Narrative**: *"Simulated bottleneck migration detected: relieving delays in 'Verification' shifts dominant operational delay toward 'Review' in this simulation scenario."*

---

## 5. API Endpoints

### 1. `POST /api/simulation`
Runs a single scenario against an existing `ProcessAnalysisResult`.
```json
{
  "datasetAnalysis": { ... },
  "scenario": {
    "name": "Add 2 Resources",
    "interventions": [
      {
        "type": "RESOURCE_INCREASE",
        "stage": "Verification",
        "additionalResources": 2
      }
    ]
  }
}
```

### 2. `POST /api/simulation/compare`
Runs multiple scenarios in parallel for objective comparison.
```json
{
  "datasetAnalysis": { ... },
  "scenarios": [
    { "name": "Scenario A", "interventions": [...] },
    { "name": "Scenario B", "interventions": [...] }
  ]
}
```

---

## 6. Assumptions & Limitations

1. **Empirical Baseline**: Uses observed historical event durations without synthetic extrapolation.
2. **Capacity Elasticity**: Modeled under Kingman queue congestion equations; real-world queue dynamics may also be affected by arrival burstiness and staffing shifts.
3. **Proportional Execution Improvement**: Assumes uniform productivity gains across cases.
4. **Exogenous Queue Relief**: Represents theoretical system response under unchanged arrival schedules.
5. **No Code Execution / LLM Math**: All simulation formulas are hardcoded pure TypeScript functions.
