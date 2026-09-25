/**
 * FlowLens AI - AI Explanation & Executive Intelligence Types
 * Phase 4: Gemini AI Explanation Layer
 * Shared Layer (Browser & Server safe)
 */

import { ProcessAnalysisResult } from "./process";
import { SimulationResult } from "./simulation";

/**
 * Strict structured evidence object passed to the AI explanation layer.
 * Zero secrets, zero unverified variables.
 */
export interface AIStructuredEvidence {
  datasetSummary: {
    name: string;
    cases: number;
    events: number;
    stages: number;
    resources: number;
  };

  /**
   * Process-level baseline metrics (Global Source of Truth)
   * Guaranteed: avgCaseCycleTime = avgCaseProcessingTime + avgCaseWaitingTime
   */
  processBaseline: {
    avgCaseCycleTime: string;          // e.g. "6h"
    avgCaseProcessingTime: string;     // e.g. "1h 40m"
    avgCaseWaitingTime: string;        // e.g. "4h 20m"
    totalProcessWaitingTime: string;   // e.g. "1d 19h"
    totalProcessProcessingTime: string;// e.g. "16h 40m"
  };

  bottleneck: {
    stage: string;
    score: number;
    rank: number;
    processingContributionPct: number;
    waitingContributionPct: number;
    dnaSignals: {
      primaryFactor: string;
      waitingHeavy: boolean;
      processingHeavy: boolean;
      highVariance: boolean;
      highVolume: boolean;
      resourceHeavy: boolean;
      peakConcentrated: boolean;
    };
    stageSpecificAvgProcessingTime: string; // e.g. "15m" for Verification
    stageSpecificAvgWaitingTime: string;    // e.g. "4h 5m" for Verification
    stageQueueWaitLabel: string;            // e.g. "Verification Average Queue Wait"
    stageProcessingLabel: string;           // e.g. "Verification Average Processing Duration"
    avgProcessingTime: string;              // Backward compatibility alias ("15m")
    avgWaitingTime: string;                 // Backward compatibility alias ("4h 5m")
  };

  rootCause: {
    primarySignal: string;
    supportingSignals: string[];
    associatedResources: Array<{
      resourceId: string;
      workloadSharePct: number;
      note: string;
    }>;
    peakPeriods: Array<{
      period: string;
      volumeSharePct: number;
      note: string;
    }>;
    upstreamStage?: string;
    downstreamStage?: string;
    upstreamAvgWait?: string;
  };

  simulation?: {
    scenarioName: string;
    interventionDescription: string;
    baseline: {
      avgCaseCycleTime: string;
      avgCaseWaitingTime: string;
      avgCaseProcessingTime: string;
      bottleneckStage: string;
      bottleneckScore: number;
    };
    simulated: {
      avgCaseCycleTime: string;
      avgCaseWaitingTime: string;
      avgCaseProcessingTime: string;
      bottleneckStage: string;
      bottleneckScore: number;
    };
    improvement: {
      cycleTimeReductionPct: number;
      waitingReductionPct: number;
      processingReductionPct: number;
      bottleneckScoreReduction: number;
    };
    migration: {
      migrated: boolean;
      pattern: string;
      fromStage: string;
      toStage?: string;
      narrative: string;
    };
    assumptions: string[];
  };
}

/**
 * Core AI Explanation structure required by Phase 4 specification
 */
export interface AIExplanation {
  summary: string;
  bottleneckExplanation: string;
  evidence: string[];
  simulationExplanation?: string;
  migrationExplanation?: string;
  assumptions: string[];
  limitations: string[];
}

/**
 * Dedicated structured bottleneck explanation
 */
export interface BottleneckExplanation {
  stage: string;
  headline: string;
  narrative: string;
  keyFactors: {
    primarySignal: string;
    waitingContributionPct: number;
    processingContributionPct: number;
    delayScore: number;
  };
  evidencePoints: string[];
}

/**
 * Dedicated structured simulation explanation
 */
export interface SimulationExplanation {
  headline: string;
  narrative: string;
  modeledIntervention: string;
  baselineVsSimulated: {
    cycleTime: { baseline: string; simulated: string; reductionPct: number };
    waitingTime: { baseline: string; simulated: string; reductionPct: number };
    processingTime: { baseline: string; simulated: string; reductionPct: number };
  };
  isSimulatedNotice: string;
}

/**
 * Dedicated structured bottleneck migration explanation
 */
export interface MigrationExplanation {
  detected: boolean;
  pattern: string;
  narrative: string;
  fromStage: string;
  toStage?: string;
  caveat: string;
}

/**
 * Executive Summary addressing the 6 key operational questions
 * Target length: 150-200 words
 */
export interface ExecutiveSummary {
  headline: string;
  processSlowingStage: string;
  operationalImpact: string;
  supportingEvidence: string[];
  simulatedInterventionImpact?: string;
  migrationOutlook?: string;
  dataLimitations: string[];
  wordCount?: number;
}

/**
 * Request payload for POST /api/ai/explain
 */
export interface AIExplanationRequest {
  analysis: ProcessAnalysisResult;
  simulation?: SimulationResult | null;
  targetStage?: string;
}

/**
 * Response payload for POST /api/ai/explain
 */
export interface AIExplanationResponse {
  success: boolean;
  explanation: AIExplanation;
  detailedBottleneck?: BottleneckExplanation;
  detailedSimulation?: SimulationExplanation;
  detailedMigration?: MigrationExplanation;
  executiveSummary?: ExecutiveSummary;
  structuredEvidence?: AIStructuredEvidence;
  metadata?: {
    model: string;
    generatedAt: string;
    cached?: boolean;
    isSimulated: boolean;
  };
  error?: string;
  code?: string;
}
