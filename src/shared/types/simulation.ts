/**
 * FlowLens AI - What-If Intervention & Bottleneck Migration Types
 * Phase 3: What-If Simulation Engine
 * Shared Layer (Browser & Server safe)
 */

import {
  ProcessMetrics,
  StageMetrics,
  BottleneckCandidate,
  BottleneckDNA,
} from "./process";

export type InterventionType =
  | "RESOURCE_INCREASE"
  | "PROCESSING_TIME_REDUCTION"
  | "QUEUE_REDUCTION";

export interface ResourceIncreaseIntervention {
  type: "RESOURCE_INCREASE";
  stage: string;
  additionalResources: number; // >= 1
}

export interface ProcessingTimeReductionIntervention {
  type: "PROCESSING_TIME_REDUCTION";
  stage: string;
  reductionPercent: number; // > 0 and <= 90
}

export interface QueueReductionIntervention {
  type: "QUEUE_REDUCTION";
  stage: string;
  reductionPercent: number; // > 0 and <= 90
}

export type Intervention =
  | ResourceIncreaseIntervention
  | ProcessingTimeReductionIntervention
  | QueueReductionIntervention;

export interface SimulationScenario {
  id?: string;
  name?: string;
  description?: string;
  interventions: Intervention[];
}

export interface SimulationValidationError {
  field: string;
  message: string;
  code:
    | "INVALID_INTERVENTION_TYPE"
    | "STAGE_NOT_FOUND"
    | "INVALID_ADDITIONAL_RESOURCES"
    | "INVALID_REDUCTION_PERCENT"
    | "EMPTY_SCENARIO"
    | "INVALID_PAYLOAD";
}

export interface StageSimulationResult {
  stageName: string;
  baselineProcessingTimeMs: number;
  simulatedProcessingTimeMs: number;
  processingTimeReductionMs: number;
  processingTimeReductionPercent: number;

  baselineWaitingTimeMs: number;
  simulatedWaitingTimeMs: number;
  waitingTimeReductionMs: number;
  waitingTimeReductionPercent: number;

  baselineScore: number;
  simulatedScore: number;
  scoreChange: number; // negative means score decreased (improved)

  baselineRank: number;
  simulatedRank: number;
  rankChange: number; // e.g. baseline 1, simulated 2 => +1 (dropped rank)

  baselineProcessingContributionPct: number;
  simulatedProcessingContributionPct: number;

  baselineWaitingContributionPct: number;
  simulatedWaitingContributionPct: number;

  baselineDNA: BottleneckDNA;
  simulatedDNA: BottleneckDNA;

  formattedBaselineAvgProcessing: string;
  formattedSimulatedAvgProcessing: string;
  formattedBaselineAvgWaiting: string;
  formattedSimulatedAvgWaiting: string;
}

export type MigrationPattern =
  | "SAME_BOTTLENECK_REMAINS"
  | "BOTTLENECK_IMPROVED_REMAINS_TOP"
  | "MIGRATED_TO_ANOTHER_STAGE"
  | "MULTIPLE_BOTTLENECK_CONVERGENCE"
  | "NO_MEANINGFUL_CHANGE";

export interface MigrationResult {
  migrated: boolean;
  pattern: MigrationPattern;
  fromStage: string;
  toStage?: string;
  previousRank: number;
  newRank?: number;
  scoreChange: number;
  scoreDifferenceBetweenTopTwo?: number;
  explanationEvidence: {
    baselineTopStage: string;
    baselineTopScore: number;
    simulatedTopStage: string;
    simulatedTopScore: number;
    thresholdUsed: number;
    rationale: string;
  };
  narrative: string; // Transparent, non-causal "simulated bottleneck migration" wording
}

export interface SimulationComparison {
  // Case-level metrics (Elapsed duration per process instance)
  baselineCycleTimeMs: number;
  simulatedCycleTimeMs: number;
  cycleTimeReductionMs: number;
  cycleTimeReductionPercent: number;

  // Aggregate process metrics (Summed across all cases)
  baselineProcessingTimeMs: number;
  simulatedProcessingTimeMs: number;
  processingReductionMs: number;
  processingReductionPercent: number;

  baselineWaitingTimeMs: number;
  simulatedWaitingTimeMs: number;
  waitingReductionMs: number;
  waitingReductionPercent: number;

  // Average per-case metrics
  baselineAvgCaseWaitingTimeMs: number;
  simulatedAvgCaseWaitingTimeMs: number;
  baselineAvgCaseProcessingTimeMs: number;
  simulatedAvgCaseProcessingTimeMs: number;

  baselineBottleneckStage: string;
  simulatedBottleneckStage: string;
  baselineBottleneckScore: number;
  simulatedBottleneckScore: number;

  // Formatted strings
  formattedBaselineCycleTime: string;
  formattedSimulatedCycleTime: string;
  formattedBaselineAvgCaseWaiting: string;
  formattedSimulatedAvgCaseWaiting: string;
  formattedBaselineAvgCaseProcessing: string;
  formattedSimulatedAvgCaseProcessing: string;
  formattedBaselineWaitingTime: string; // Aggregate
  formattedSimulatedWaitingTime: string; // Aggregate
  formattedBaselineProcessingTime: string; // Aggregate
  formattedSimulatedProcessingTime: string; // Aggregate
}

export interface SimulationAssumption {
  id: string;
  title: string;
  statement: string;
}

export interface SimulationExplanationPayload {
  scenario: SimulationScenario;
  baselineSummary: {
    cycleTimeMs: number;
    bottleneckStage: string;
    bottleneckScore: number;
    bottleneckFactor: string;
  };
  simulatedSummary: {
    cycleTimeMs: number;
    bottleneckStage: string;
    bottleneckScore: number;
    bottleneckFactor: string;
  };
  improvement: {
    cycleTimeReductionPct: number;
    waitingReductionPct: number;
    processingReductionPct: number;
  };
  migration: MigrationResult;
  evidence: {
    stageOutcomes: Array<{
      stageName: string;
      baselineScore: number;
      simulatedScore: number;
      rankChange: number;
      primaryFactor: string;
    }>;
  };
  assumptions: string[];
}

/**
 * Objective, measurable outcome of an intervention
 */
export interface SimulationOutcome {
  intervention: Intervention;
  projectedCycleTimeReductionPercent: number;
  projectedWaitingReductionPercent: number;
  projectedProcessingReductionPercent: number;
  bottleneckScoreReduction: number;
  migrationDetected: boolean;
  newBottleneckStage?: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  baselineMetrics: ProcessMetrics;
  simulatedMetrics: ProcessMetrics;
  baselineStages: StageMetrics[];
  simulatedStages: StageMetrics[];
  baselineBottlenecks: BottleneckCandidate[];
  simulatedBottlenecks: BottleneckCandidate[];
  stageResults: StageSimulationResult[];
  comparison: SimulationComparison;
  migration: MigrationResult;
  assumptions: SimulationAssumption[];
  explanationPayload: SimulationExplanationPayload;
  outcomes: SimulationOutcome[];
}
