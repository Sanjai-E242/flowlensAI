/**
 * FlowLens AI - What-If Simulation Engine Constants & Assumptions
 * Phase 3: What-If Simulation Engine
 */

import { SimulationAssumption } from "@/shared/types";

export const SIMULATION_LIMITS = {
  MIN_REDUCTION_PERCENT: 1,
  MAX_REDUCTION_PERCENT: 90,
  MIN_ADDITIONAL_RESOURCES: 1,
  MAX_ADDITIONAL_RESOURCES: 50,
  MIGRATION_CONVERGENCE_THRESHOLD: 3.0,
  MEANINGFUL_CHANGE_THRESHOLD: 0.5,
  SIGNIFICANT_IMPROVEMENT_THRESHOLD: 2.0,
  RESIDUAL_QUEUE_FLOOR_RATIO: 0.05,
} as const;

export const SIMULATION_ASSUMPTIONS: SimulationAssumption[] = [
  {
    id: "historical-baseline",
    title: "Empirical Baseline",
    statement:
      "Uses observed historical event execution durations and inter-stage queue delays as empirical foundation without synthetic extrapolation.",
  },
  {
    id: "queue-elasticity",
    title: "Capacity Expansion & Queue Elasticity",
    statement:
      "Resource additions model service rate expansion under Kingman queue congestion dynamics: saturated queues experience exponential delay relief as utilization drops.",
  },
  {
    id: "proportional-processing",
    title: "Proportional Processing Improvement",
    statement:
      "Processing time reductions apply proportionally across all historical case executions for the targeted activity.",
  },
  {
    id: "exogenous-queue-relief",
    title: "Operational Queue Streamlining",
    statement:
      "Queue reduction interventions simulate targeted operational policies (e.g. automated triage, batch-size rebalancing, or active SLA routing).",
  },
  {
    id: "analytical-projection",
    title: "Deterministic Analytical Projection",
    statement:
      "All outputs are transparent, deterministic mathematical projections rather than probabilistic forecasts. They reflect theoretical system response under unchanged arrival patterns.",
  },
];
