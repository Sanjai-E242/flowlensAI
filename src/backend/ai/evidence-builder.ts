/**
 * FlowLens AI - Structured Evidence Builder
 * Phase 4: Gemini AI Explanation Layer
 * Server-Only Module
 *
 * Deterministically constructs sanitized evidence contracts for LLM consumption.
 * Guarantees zero secret leakage and zero unverified metrics.
 */

import {
  ProcessAnalysisResult,
  SimulationResult,
  AIStructuredEvidence,
  BottleneckCandidate,
  Intervention,
} from "@/shared/types";

/**
 * Format human-readable intervention descriptions
 */
function describeIntervention(intervention: Intervention): string {
  switch (intervention.type) {
    case "RESOURCE_INCREASE":
      return `Add ${intervention.additionalResources} resource${
        intervention.additionalResources > 1 ? "s" : ""
      } to ${intervention.stage}`;
    case "PROCESSING_TIME_REDUCTION":
      return `Reduce processing duration of ${intervention.stage} by ${intervention.reductionPercent}%`;
    case "QUEUE_REDUCTION":
      return `Reduce queue waiting time of ${intervention.stage} by ${intervention.reductionPercent}%`;
  }
}

/**
 * Deterministically build sanitized AI structured evidence from verified analysis & simulation results.
 */
export function buildStructuredEvidence(
  analysis: ProcessAnalysisResult,
  simulation?: SimulationResult | null,
  targetStage?: string
): AIStructuredEvidence {
  if (!analysis || !analysis.bottleneckCandidates || analysis.bottleneckCandidates.length === 0) {
    throw new Error("Invalid ProcessAnalysisResult: missing bottleneck candidates.");
  }

  // Identify candidate to explain (default to dominant #1 bottleneck)
  const candidate: BottleneckCandidate =
    (targetStage && analysis.bottleneckCandidates.find((b) => b.stageName === targetStage)) ||
    analysis.bottleneckCandidates[0];

  const rootCause = analysis.rootCauses[candidate.stageName] || {
    stage: candidate.stageName,
    primaryCause: candidate.dna.primaryFactor,
    supportingSignals: [],
    evidence: {
      waitingContributionPct: candidate.stageMetrics.waitingContributionPct,
      processingContributionPct: candidate.stageMetrics.processingContributionPct,
      cycleContributionPct: Math.round(candidate.delayContributionScore),
    },
    interpretation: candidate.rationale,
  };

  // Find corresponding explanationPayload for rich resource / peak / transition evidence
  const evidencePayload = analysis.explanationPayloads.find(
    (p) => p.stage === candidate.stageName
  );

  const associatedResources = evidencePayload
    ? evidencePayload.resourceEvidence.map((r) => ({
        resourceId: r.resourceId,
        workloadSharePct: r.workloadSharePct,
        note: r.note,
      }))
    : rootCause.evidence.associatedResources?.map((id) => ({
        resourceId: id,
        workloadSharePct: rootCause.evidence.resourceWorkloadSharePct || 0,
        note: `Associated with workload concentration around resource ${id}`,
      })) || [];

  const peakPeriods = evidencePayload
    ? evidencePayload.peakEvidence.map((p) => ({
        period: p.period,
        volumeSharePct: p.volumeSharePct,
        note: p.note,
      }))
    : analysis.peakAnalysis.peakHours.map((h) => ({
        period: h,
        volumeSharePct: Math.round(analysis.peakAnalysis.peakThresholdRatio * 100),
        note: `Observed peak activity window: ${h}`,
      }));

  let upstreamAvgWait: string | undefined;
  if (evidencePayload && evidencePayload.upstreamEvidence.length > 0) {
    upstreamAvgWait = evidencePayload.upstreamEvidence[0].formattedAvgWait;
  }

  const structured: AIStructuredEvidence = {
    datasetSummary: {
      name: analysis.datasetSummary.name,
      cases: analysis.datasetSummary.uniqueCasesCount,
      events: analysis.datasetSummary.validEventsCount,
      stages: analysis.datasetSummary.uniqueStagesCount,
      resources: analysis.datasetSummary.uniqueResourcesCount,
    },
    processBaseline: {
      avgCaseCycleTime: analysis.processMetrics.formattedAvgCycleTime,
      avgCaseProcessingTime: analysis.processMetrics.formattedAvgProcessingTime,
      avgCaseWaitingTime: analysis.processMetrics.formattedAvgWaitingTime,
      totalProcessWaitingTime: analysis.processMetrics.formattedTotalWaitingTime,
      totalProcessProcessingTime: analysis.processMetrics.formattedTotalProcessingTime,
    },
    bottleneck: {
      stage: candidate.stageName,
      score: candidate.delayContributionScore,
      rank: candidate.rank,
      processingContributionPct: candidate.stageMetrics.processingContributionPct,
      waitingContributionPct: candidate.stageMetrics.waitingContributionPct,
      dnaSignals: {
        primaryFactor: candidate.dna.primaryFactor,
        waitingHeavy: candidate.dna.waitingHeavy,
        processingHeavy: candidate.dna.processingHeavy,
        highVariance: candidate.dna.highVariance,
        highVolume: candidate.dna.highVolume,
        resourceHeavy: candidate.dna.resourceHeavy,
        peakConcentrated: candidate.dna.peakConcentrated,
      },
      stageSpecificAvgProcessingTime: candidate.stageMetrics.formattedAvgProcessingTime,
      stageSpecificAvgWaitingTime: candidate.stageMetrics.formattedAvgWaitingTime,
      stageQueueWaitLabel: `${candidate.stageName} Average Queue Wait`,
      stageProcessingLabel: `${candidate.stageName} Average Processing Duration`,
      avgProcessingTime: candidate.stageMetrics.formattedAvgProcessingTime,
      avgWaitingTime: candidate.stageMetrics.formattedAvgWaitingTime,
    },
    rootCause: {
      primarySignal: rootCause.primaryCause,
      supportingSignals: rootCause.supportingSignals,
      associatedResources,
      peakPeriods,
      upstreamStage: rootCause.evidence.upstreamStage,
      downstreamStage: rootCause.evidence.downstreamStage,
      upstreamAvgWait,
    },
  };

  if (simulation) {
    const interventionDescription = simulation.scenario.interventions
      .map(describeIntervention)
      .join("; ");

    structured.simulation = {
      scenarioName: simulation.scenario.name || "Custom Intervention",
      interventionDescription,
      baseline: {
        avgCaseCycleTime: simulation.comparison.formattedBaselineCycleTime,
        avgCaseWaitingTime: simulation.comparison.formattedBaselineAvgCaseWaiting,
        avgCaseProcessingTime: simulation.comparison.formattedBaselineAvgCaseProcessing,
        bottleneckStage: simulation.comparison.baselineBottleneckStage,
        bottleneckScore: simulation.comparison.baselineBottleneckScore,
      },
      simulated: {
        avgCaseCycleTime: simulation.comparison.formattedSimulatedCycleTime,
        avgCaseWaitingTime: simulation.comparison.formattedSimulatedAvgCaseWaiting,
        avgCaseProcessingTime: simulation.comparison.formattedSimulatedAvgCaseProcessing,
        bottleneckStage: simulation.comparison.simulatedBottleneckStage,
        bottleneckScore: simulation.comparison.simulatedBottleneckScore,
      },
      improvement: {
        cycleTimeReductionPct: simulation.comparison.cycleTimeReductionPercent,
        waitingReductionPct: simulation.comparison.waitingReductionPercent,
        processingReductionPct: simulation.comparison.processingReductionPercent,
        bottleneckScoreReduction:
          Math.round(
            (simulation.comparison.baselineBottleneckScore -
              simulation.comparison.simulatedBottleneckScore) *
              10
          ) / 10,
      },
      migration: {
        migrated: simulation.migration.migrated,
        pattern: simulation.migration.pattern,
        fromStage: simulation.migration.fromStage,
        toStage: simulation.migration.toStage,
        narrative: simulation.migration.narrative,
      },
      assumptions: simulation.assumptions.map((a) => a.statement),
    };
  }

  return structured;
}
