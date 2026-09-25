# FlowLens AI — Process Engine Documentation
**Phase 1: Deterministic Event Data Engine**

---

## 1. Overview & Objective

FlowLens AI answers the core operational question: **"Where Does the Process Actually Slow Down?"**

Traditional analytics often commit a fundamental fallacy: equating the longest task duration with the process bottleneck. In real-world workflows, the dominant delay is frequently caused by **unseen queueing and waiting time between steps**, not active execution time.

The Phase 1 Event Data Engine provides a rigorous, deterministic, type-safe foundation for parsing process event logs, reconstructing chronological execution paths, computing precise processing and waiting durations, and ranking bottleneck delay contributions.

---

## 2. Canonical Event Data Format

FlowLens AI supports CSV event datasets. The parser normalizes column headers against standard aliases, allowing flexible casing, spacing, and nomenclature.

### Required Fields

| Canonical Name | Common Aliases Supported | Description | Example |
| :--- | :--- | :--- | :--- |
| `case_id` | `caseid`, `case`, `case id`, `instance_id`, `order_id`, `ticket_id` | Unique identifier for a process instance / trace | `C101` |
| `activity` | `stage`, `process_stage`, `step`, `task`, `event_name` | Name of the process lifecycle step or activity | `Verification` |
| `start_time` | `start`, `started_at`, `start_timestamp`, `start_date`, `begin_time` | Timestamp when the activity commenced | `2026-09-01 11:30:00` |
| `end_time` | `end`, `completed_at`, `end_timestamp`, `end_date`, `finish_time` | Timestamp when the activity finished | `2026-09-01 11:45:00` |

### Optional Fields

| Canonical Name | Common Aliases Supported | Description | Example |
| :--- | :--- | :--- | :--- |
| `resource_id` | `resource`, `operator`, `user`, `agent`, `assignee`, `worker` | Identifier for the person or system executing the step | `R_VR_01` |
| `status` | `state`, `event_status`, `stage_status`, `result` | Execution outcome | `completed` |
| `location` | `site`, `branch`, `facility`, `region`, `department` | Geographic or organizational location | `HQ-East` |
| `priority` | `urgency`, `severity`, `tier` | Priority tier | `High` |

*Any additional columns in the CSV are safely preserved under the `metadata` dictionary on each normalized event.*

---

## 3. Time Calculations & Metric Definitions

All internal engine calculations are performed using high-precision integer milliseconds (`ms`) and formatted as human-readable durations (`1h 24m`, `45s`, `2d`) at API/UI boundaries.

### 1. Activity Processing Time
The active duration required to execute a specific stage:
$$\text{processingTime} = \text{endTime} - \text{startTime}$$

*Constraint:* If $\text{endTime} < \text{startTime}$, the row is rejected with an `END_BEFORE_START` validation error.

### 2. Inter-Stage Waiting Time
The queueing delay elapsed between the completion of the preceding activity and the commencement of the current activity within the same case:
$$\text{waitingTime}_i = \text{startTime}_i - \text{endTime}_{i-1}$$

*Special Cases:*
* For the initial activity in any case ($i = 0$): $\text{waitingTime}_0 = 0$.
* If $\text{waitingTime}_i < 0$ (parallel or overlapping stage execution): The overlap is flagged as a `DataQualityIssue` (`OVERLAPPING_EVENTS`), and $\text{waitingTime}$ is clamped to $0$ to prevent negative metric corruption.

### 3. Total Case Cycle Time (Lead Time)
The total elapsed wall-clock duration from the earliest start to the latest completion in a process case:
$$\text{cycleTime} = \max(\text{endTimestamp}) - \min(\text{startTimestamp})$$

### 4. Process Efficiency
The ratio of value-adding active processing time to total process lead time:
$$\text{processEfficiency} = \frac{\sum \text{processingTime}}{\sum \text{processingTime} + \sum \text{waitingTime}} \times 100\%$$

---

## 4. Phase 1 Bottleneck Contribution Model

FlowLens AI does **NOT** rank bottlenecks solely by execution duration. Instead, it measures how much delay a stage introduces into the end-to-end process flow.

### Formulas

1. **Processing Contribution Percentage ($P_s$):**
   $$P_s = \frac{\sum \text{processingTime}_s}{\sum \text{totalProcessProcessingTime}} \times 100$$

2. **Waiting Contribution Percentage ($W_s$):**
   $$W_s = \frac{\sum \text{waitingTime}_s}{\sum \text{totalProcessWaitingTime}} \times 100$$

3. **Composite Delay Contribution Score ($D_s$):**
   $$D_s = (w_{\text{proc}} \times P_s) + (w_{\text{wait}} \times W_s)$$

* **Default Weights:**
  * $w_{\text{proc}} = 0.4$ (40% weight on active processing duration)
  * $w_{\text{wait}} = 0.6$ (60% weight on accumulated queueing/waiting delays)
* Configurable via `DEFAULT_BOTTLENECK_WEIGHTS`.

### Example Proof: The Hidden Bottleneck
In the synthetic benchmark dataset:
* `Review` has an average processing time of **60 minutes** per case ($P_{\text{Review}} \approx 60\%$), but only **5 minutes** of waiting time ($W_{\text{Review}} \approx 2.3\%$). Delay Score: **25.4**.
* `Verification` has a modest processing time of **15 minutes** ($P_{\text{Verification}} \approx 15\%$), but **200 minutes** of accumulated waiting delay ($W_{\text{Verification}} \approx 93.0\%$). Delay Score: **61.8**.

FlowLens AI correctly flags **Verification** as the **#1 Bottleneck Candidate**, exposing the queue congestion that traditional task-duration metrics overlook.

---

## 5. Bottleneck DNA Foundation

Phase 1 establishes a deterministic diagnostic signal profile for each process stage:

* **`waitingHeavy`**: Stage accounts for $\ge 25\%$ of all process waiting time or total waiting exceeds $1.5\times$ processing duration.
* **`processingHeavy`**: Stage accounts for $\ge 25\%$ of all process execution duration.
* **`highVariance`**: Coefficient of Variation $(\sigma / \mu) \ge 0.60$, indicating volatile, unpredictable performance.
* **`highVolume`**: Event frequency is $\ge 30\%$ above the average stage volume.
* **`primaryFactor`**: Automatically classified as `WAITING`, `PROCESSING`, `VARIABILITY`, or `VOLUME`.

---

## 6. Supabase Database Schema

Applied via Supabase MCP (`apply_migration`) to project `flowlens-ai`:

```sql
-- Datasets Table
CREATE TABLE public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    original_filename TEXT,
    row_count INTEGER NOT NULL DEFAULT 0,
    case_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process Events Table
CREATE TABLE public.process_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,
    activity TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    resource_id TEXT,
    status TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_process_events_dataset_id ON public.process_events(dataset_id);
CREATE INDEX idx_process_events_case_id ON public.process_events(case_id);
CREATE INDEX idx_process_events_activity ON public.process_events(activity);
CREATE INDEX idx_process_events_start_time ON public.process_events(start_time);
```

Row Level Security (RLS) is enabled on all tables.

---

## 7. Known Limitations & Phase 2 Roadmap

### Intentional Phase 1 Exclusions
1. **Gemini AI Explanation Layer**: AI is intentionally not called in Phase 1 to guarantee deterministic algorithmic calculations first. Gemini will be connected in Phase 3 for conversational insights.
2. **Resource Overload / Shift Modelling**: Basic resource metrics are collected, but advanced worker capacity constraints belong to Phase 2.
3. **What-If Simulation**: Simulating stage acceleration and capacity adjustments will be developed in Phase 2.
4. **Bottleneck Migration**: Predicting downstream bottleneck shift after intervention will be implemented in Phase 2.
5. **3D Process Flow Visualization**: Phase 1 includes a functional testing sandbox; 3D visualization and animated flow lines are reserved for Phase 4.
