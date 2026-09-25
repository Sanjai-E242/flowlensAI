/**
 * FlowLens AI - Deterministic Bottleneck Contribution & DNA Engine
 * Phase 1: Event Data Engine
 */

import {
  StageMetrics,
  ProcessMetrics,
  BottleneckCandidate,
  BottleneckDNA,
  ResourceMetrics,
  PeakAnalysisResult,
  NormalizedEvent,
} from "@/shared/types";
import {
  DEFAULT_BOTTLENECK_WEIGHTS,
  BOTTLENECK_DNA_THRESHOLDS,
} from "./constants";

export interface BottleneckModelOptions {
  processingWeight?: number;
  waitingWeight?: number;
  resourceMetrics?: ResourceMetrics[];
  peakAnalysis?: PeakAnalysisResult;
  events?: NormalizedEvent[];
}

/**
 * Calculates deterministic Bottleneck DNA signals for a stage (Phase 2).
 */
export function evaluateBottleneckDNA(
  stage: StageMetrics,
  processMetrics: ProcessMetrics,
  context?: {
    resourceMetrics?: ResourceMetrics[];
    peakAnalysis?: PeakAnalysisResult;
    events?: NormalizedEvent[];
  }
): BottleneckDNA {
  const avgStageVolume =
    processMetrics.uniqueStagesCount > 0
      ? processMetrics.totalEvents / processMetrics.uniqueStagesCount
      : stage.eventCount;

  const coefficientOfVariation =
    stage.avgProcessingTimeMs > 0
      ? stage.processingTimeStdDev / stage.avgProcessingTimeMs
      : 0;

  const waitingHeavy =
    stage.waitingContributionPct >= BOTTLENECK_DNA_THRESHOLDS.WAITING_HEAVY_PCT ||
    stage.totalWaitingTimeMs > stage.totalProcessingTimeMs * 1.5;

  const processingHeavy =
    stage.processingContributionPct >= BOTTLENECK_DNA_THRESHOLDS.PROCESSING_HEAVY_PCT;

  const highVariance =
    coefficientOfVariation >= BOTTLENECK_DNA_THRESHOLDS.HIGH_VARIANCE_COV;

  const highVolume =
    stage.eventCount >= avgStageVolume * BOTTLENECK_DNA_THRESHOLDS.HIGH_VOLUME_FACTOR;

  // Resource overload signal association (Phase 2)
  let resourceHeavy = false;
  if (context?.resourceMetrics && context.resourceMetrics.length > 0) {
    const stageResources = context.resourceMetrics.filter((r) =>
      r.stagesHandled.includes(stage.stageName)
    );
    resourceHeavy = stageResources.some(
      (r) =>
        r.isOverloaded ||
        r.workloadRatioToAvg >= BOTTLENECK_DNA_THRESHOLDS.RESOURCE_HEAVY_RATIO
    );
  }

  // Peak period concentration association (Phase 2)
  let peakConcentrated = false;
  if (
    context?.peakAnalysis &&
    context.events &&
    context.peakAnalysis.peakHours.length > 0
  ) {
    const peakHourSet = new Set(
      context.peakAnalysis.hourlyBuckets
        .filter((b) => b.isPeak)
        .map((b) => b.hour)
    );
    const stageEvents = context.events.filter(
      (e) => e.activity === stage.stageName
    );
    if (stageEvents.length > 0) {
      const peakEvents = stageEvents.filter((e) =>
        peakHourSet.has(new Date(e.startTimestamp).getUTCHours())
      );
      const peakPct = (peakEvents.length / stageEvents.length) * 100;
      if (peakPct >= BOTTLENECK_DNA_THRESHOLDS.PEAK_CONCENTRATION_PCT) {
        peakConcentrated = true;
      }
    }
  }

  // Determine primary factor deterministically
  let primaryFactor: BottleneckDNA["primaryFactor"] = "PROCESSING";
  const tags: string[] = [];

  if (waitingHeavy && stage.totalWaitingTimeMs >= stage.totalProcessingTimeMs) {
    primaryFactor = "WAITING";
  } else if (resourceHeavy && (!processingHeavy || stage.processingContributionPct < 35)) {
    primaryFactor = "RESOURCE";
  } else if (highVariance && coefficientOfVariation > 1.0) {
    primaryFactor = "VARIABILITY";
  } else if (peakConcentrated && (!processingHeavy || stage.processingContributionPct < 30)) {
    primaryFactor = "PEAK";
  } else if (processingHeavy) {
    primaryFactor = "PROCESSING";
  } else if (highVolume) {
    primaryFactor = "VOLUME";
  }

  if (waitingHeavy) tags.push("Queue Congestion");
  if (processingHeavy) tags.push("Prolonged Execution");
  if (highVariance) tags.push("Unstable Cycle Times");
  if (highVolume) tags.push("High Event Frequency");
  if (resourceHeavy) tags.push("Resource Constraint");
  if (peakConcentrated) tags.push("Peak Concentration");

  // Confidence score bounded between 0.50 and 0.98 based on signal clarity
  let signalCount = 0;
  if (waitingHeavy) signalCount++;
  if (processingHeavy) signalCount++;
  if (highVariance) signalCount++;
  if (highVolume) signalCount++;
  if (resourceHeavy) signalCount++;
  if (peakConcentrated) signalCount++;

  const confidenceScore = Math.min(0.98, Math.max(0.55, 0.5 + signalCount * 0.1));

  return {
    waitingHeavy,
    processingHeavy,
    highVariance,
    highVolume,
    resourceHeavy,
    peakConcentrated,
    primaryFactor,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    tags,
  };
}

/**
 * Ranks all process stages by their Phase 1 & 2 Bottleneck Contribution Score.
 *
 * Scoring Formula:
 * delayContributionScore = (W_proc * normalizedProcessingContribution) + (W_wait * normalizedWaitingContribution)
 */
export function calculateBottleneckCandidates(
  stages: StageMetrics[],
  processMetrics: ProcessMetrics,
  options?: BottleneckModelOptions
): BottleneckCandidate[] {
  if (stages.length === 0) return [];

  const procWeight =
    options?.processingWeight ?? DEFAULT_BOTTLENECK_WEIGHTS.PROCESSING_WEIGHT;
  const waitWeight =
    options?.waitingWeight ?? DEFAULT_BOTTLENECK_WEIGHTS.WAITING_WEIGHT;

  // Normalization factor: ensure weights sum to 1.0
  const weightSum = procWeight + waitWeight;
  const normProcWeight = procWeight / weightSum;
  const normWaitWeight = waitWeight / weightSum;

  const context = {
    resourceMetrics: options?.resourceMetrics,
    peakAnalysis: options?.peakAnalysis,
    events: options?.events,
  };

  const candidates: BottleneckCandidate[] = stages.map((stage) => {
    // Both contributions are percentages (0 - 100)
    const processingScore = stage.processingContributionPct;
    const waitingScore = stage.waitingContributionPct;

    const compositeScore =
      normProcWeight * processingScore + normWaitWeight * waitingScore;

    const dna = evaluateBottleneckDNA(stage, processMetrics, context);

    let rationale = "";
    if (dna.primaryFactor === "WAITING") {
      rationale = `Accumulates ${stage.waitingContributionPct}% of all waiting time in the process (${stage.formattedTotalWaitingTime}), causing upstream queue stalls.`;
    } else if (dna.primaryFactor === "PROCESSING") {
      rationale = `Consumes ${stage.processingContributionPct}% of total processing time (${stage.formattedTotalProcessingTime}) with an average duration of ${stage.formattedAvgProcessingTime}.`;
    } else if (dna.primaryFactor === "RESOURCE") {
      rationale = `Associated with concentrated resource workload and potential operator bottleneck capacity.`;
    } else if (dna.primaryFactor === "PEAK") {
      rationale = `Associated with temporal arrival spikes during peak operational periods.`;
    } else if (dna.primaryFactor === "VARIABILITY") {
      rationale = `Exhibits high processing time volatility (StdDev: ${Math.round(
        stage.processingTimeStdDev / 1000
      )}s), leading to unpredictable lead times.`;
    } else {
      rationale = `High concentration of events (${stage.eventCount} executions) contributing to overall lead time.`;
    }

    return {
      rank: 0, // Assigned after sorting
      stageName: stage.stageName,
      delayContributionScore: Math.round(compositeScore * 10) / 10,
      processingScore: Math.round(processingScore * 10) / 10,
      waitingScore: Math.round(waitingScore * 10) / 10,
      dna,
      stageMetrics: stage,
      rationale,
    };
  });

  // Sort by delayContributionScore descending
  candidates.sort((a, b) => b.delayContributionScore - a.delayContributionScore);

  // Assign ranks (1-based)
  candidates.forEach((candidate, idx) => {
    candidate.rank = idx + 1;
  });

  return candidates;
}

