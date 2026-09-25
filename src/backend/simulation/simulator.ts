/**
 * FlowLens AI - Deterministic What-If Simulator
 * Phase 3: What-If Simulation Engine
 */

import {
  ProcessAnalysisResult,
  SimulationScenario,
  SimulationResult,
  StageMetrics,
  ProcessMetrics,
  BottleneckCandidate,
  StageSimulationResult,
  SimulationComparison,
  SimulationOutcome,
  SimulationExplanationPayload,
  ResourceMetrics,
  Intervention,
} from "@/shared/types";
import { formatDurationMs } from "@/shared/utils";
import { calculateBottleneckCandidates } from "@/backend/engine/bottleneck-model";
import { SIMULATION_ASSUMPTIONS, SIMULATION_LIMITS } from "./constants";
import { validateSimulationScenario } from "./validator";
import { detectBottleneckMigration } from "./migration";

/**
 * Calculates deterministic queue delay relief when capacity (headcount) is expanded.
 * Models Kingman non-linear congestion queue dynamics:
 * Heavily congested stages (high waiting contribution) experience exponential delay relief.
 */
export function calculateResourceQueueReductionFactor(
  stage: StageMetrics,
  additionalResources: number,
  currentResourcesCount: number
): { reductionRatio: number; reductionPercent: number; delayRatio: number } {
  const cBase = Math.max(1, currentResourcesCount);
  const cSim = cBase + additionalResources;

  // Queue utilization proxy derived from empirical waiting contribution
  const rho0 = Math.min(0.95, Math.max(0.4, stage.waitingContributionPct / 100));
  const rhoSim = rho0 * (cBase / cSim);

  // Kingman congestion factor ratio: W ~ rho / (1 - rho)
  const baseCongestionFactor = rho0 / (1 - rho0);
  const simCongestionFactor = rhoSim / (1 - rhoSim);
  const theoreticalRatio = simCongestionFactor / baseCongestionFactor;

  // Enforce realistic residual floor for inter-stage routing / handoff
  const delayRatio = Math.max(
    SIMULATION_LIMITS.RESIDUAL_QUEUE_FLOOR_RATIO,
    Math.min(1.0, theoreticalRatio)
  );

  const reductionRatio = 1 - delayRatio;
  const reductionPercent = Math.round(reductionRatio * 1000) / 10;

  return { reductionRatio, reductionPercent, delayRatio };
}

/**
 * Runs a deterministic what-if process simulation against an empirical analysis baseline.
 * NEVER mutates the input baseline.
 */
export function simulateScenario(
  baselineAnalysis: ProcessAnalysisResult,
  scenario: SimulationScenario
): SimulationResult {
  // 1. Validate scenario
  const validation = validateSimulationScenario(scenario, baselineAnalysis);
  if (!validation.isValid) {
    const errorDetails = validation.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
    throw new Error(`Simulation scenario validation failed: ${errorDetails}`);
  }

  // 2. Deep clone baseline stages and metrics to ensure complete immutability
  const baselineStages: StageMetrics[] = JSON.parse(JSON.stringify(baselineAnalysis.stages));
  const baselineMetrics: ProcessMetrics = JSON.parse(JSON.stringify(baselineAnalysis.processMetrics));
  const baselineBottlenecks: BottleneckCandidate[] = JSON.parse(
    JSON.stringify(baselineAnalysis.bottleneckCandidates)
  );
  const simulatedStages: StageMetrics[] = JSON.parse(JSON.stringify(baselineAnalysis.stages));

  // Map resources per stage
  const stageResourcesMap = new Map<string, ResourceMetrics[]>();
  for (const r of baselineAnalysis.resources) {
    for (const stageName of r.stagesHandled) {
      const list = stageResourcesMap.get(stageName) ?? [];
      list.push(r);
      stageResourcesMap.set(stageName, list);
    }
  }

  // 3. Apply interventions deterministically
  const stageInterventions = new Map<string, Intervention[]>();
  for (const intervention of scenario.interventions) {
    const list = stageInterventions.get(intervention.stage) ?? [];
    list.push(intervention);
    stageInterventions.set(intervention.stage, list);
  }

  for (const stage of simulatedStages) {
    const interventions = stageInterventions.get(stage.stageName);
    if (!interventions || interventions.length === 0) continue;

    for (const item of interventions) {
      switch (item.type) {
        case "RESOURCE_INCREASE": {
          const currentResources = stageResourcesMap.get(stage.stageName) ?? [];
          const { delayRatio } = calculateResourceQueueReductionFactor(
            stage,
            item.additionalResources,
            currentResources.length
          );

          stage.totalWaitingTimeMs = Math.round(stage.totalWaitingTimeMs * delayRatio);
          stage.avgWaitingTimeMs = Math.round(stage.avgWaitingTimeMs * delayRatio);
          stage.medianWaitingTimeMs = Math.round(stage.medianWaitingTimeMs * delayRatio);
          stage.minWaitingTimeMs = Math.round(stage.minWaitingTimeMs * delayRatio);
          stage.maxWaitingTimeMs = Math.round(stage.maxWaitingTimeMs * delayRatio);
          break;
        }

        case "PROCESSING_TIME_REDUCTION": {
          const factor = Math.max(0.1, 1 - item.reductionPercent / 100);

          stage.totalProcessingTimeMs = Math.round(stage.totalProcessingTimeMs * factor);
          stage.avgProcessingTimeMs = Math.round(stage.avgProcessingTimeMs * factor);
          stage.medianProcessingTimeMs = Math.round(stage.medianProcessingTimeMs * factor);
          stage.minProcessingTimeMs = Math.round(stage.minProcessingTimeMs * factor);
          stage.maxProcessingTimeMs = Math.round(stage.maxProcessingTimeMs * factor);
          stage.processingTimeStdDev = Math.round(stage.processingTimeStdDev * factor * 100) / 100;
          stage.processingTimeVariance = Math.round(Math.pow(stage.processingTimeStdDev, 2) * 100) / 100;
          break;
        }

        case "QUEUE_REDUCTION": {
          const factor = Math.max(0.1, 1 - item.reductionPercent / 100);

          stage.totalWaitingTimeMs = Math.round(stage.totalWaitingTimeMs * factor);
          stage.avgWaitingTimeMs = Math.round(stage.avgWaitingTimeMs * factor);
          stage.medianWaitingTimeMs = Math.round(stage.medianWaitingTimeMs * factor);
          stage.minWaitingTimeMs = Math.round(stage.minWaitingTimeMs * factor);
          stage.maxWaitingTimeMs = Math.round(stage.maxWaitingTimeMs * factor);
          break;
        }
      }
    }

    // Refresh human-readable strings for modified stage
    stage.formattedAvgProcessingTime = formatDurationMs(stage.avgProcessingTimeMs);
    stage.formattedAvgWaitingTime = formatDurationMs(stage.avgWaitingTimeMs);
    stage.formattedTotalProcessingTime = formatDurationMs(stage.totalProcessingTimeMs);
    stage.formattedTotalWaitingTime = formatDurationMs(stage.totalWaitingTimeMs);
  }

  // 4. Recalculate Process-Level Metrics
  const simulatedTotalProcessingMs = simulatedStages.reduce(
    (acc, s) => acc + s.totalProcessingTimeMs,
    0
  );
  const simulatedTotalWaitingMs = simulatedStages.reduce(
    (acc, s) => acc + s.totalWaitingTimeMs,
    0
  );
  const simulatedTotalLeadTimeMs = simulatedTotalProcessingMs + simulatedTotalWaitingMs;

  // Update contribution percentages for all stages
  for (const s of simulatedStages) {
    s.processingContributionPct =
      simulatedTotalProcessingMs > 0
        ? Math.round((s.totalProcessingTimeMs / simulatedTotalProcessingMs) * 1000) / 10
        : 0;

    s.waitingContributionPct =
      simulatedTotalWaitingMs > 0
        ? Math.round((s.totalWaitingTimeMs / simulatedTotalWaitingMs) * 1000) / 10
        : 0;

    s.cycleContributionPct =
      simulatedTotalLeadTimeMs > 0
        ? Math.round(((s.totalProcessingTimeMs + s.totalWaitingTimeMs) / simulatedTotalLeadTimeMs) * 1000) / 10
        : 0;
  }

  // Recalculate average case cycle time
  const baselineTotalLeadMs =
    baselineMetrics.totalProcessProcessingTimeMs + baselineMetrics.totalProcessWaitingTimeMs;
  const leadReductionMs = Math.max(0, baselineTotalLeadMs - simulatedTotalLeadTimeMs);
  const caseCount = Math.max(1, baselineMetrics.totalCases);
  const avgCycleReductionMs = Math.round(leadReductionMs / caseCount);

  const simulatedAvgCycleTimeMs = Math.max(
    1,
    baselineMetrics.avgCaseCycleTimeMs - avgCycleReductionMs
  );

  const simulatedAvgCaseProcessingTimeMs =
    caseCount > 0 ? Math.round(simulatedTotalProcessingMs / caseCount) : 0;
  const simulatedAvgCaseWaitingTimeMs =
    caseCount > 0 ? Math.round(simulatedTotalWaitingMs / caseCount) : 0;

  const simulatedMetrics: ProcessMetrics = {
    totalCases: baselineMetrics.totalCases,
    totalEvents: baselineMetrics.totalEvents,
    uniqueStagesCount: simulatedStages.length,
    avgCaseCycleTimeMs: simulatedAvgCycleTimeMs,
    medianCaseCycleTimeMs: Math.max(1, baselineMetrics.medianCaseCycleTimeMs - avgCycleReductionMs),
    minCaseCycleTimeMs: Math.max(1, baselineMetrics.minCaseCycleTimeMs - avgCycleReductionMs),
    maxCaseCycleTimeMs: Math.max(1, baselineMetrics.maxCaseCycleTimeMs - avgCycleReductionMs),
    totalProcessProcessingTimeMs: simulatedTotalProcessingMs,
    totalProcessWaitingTimeMs: simulatedTotalWaitingMs,
    avgCaseProcessingTimeMs: simulatedAvgCaseProcessingTimeMs,
    avgCaseWaitingTimeMs: simulatedAvgCaseWaitingTimeMs,
    avgProcessEfficiencyPct:
      simulatedTotalLeadTimeMs > 0
        ? Math.round((simulatedTotalProcessingMs / simulatedTotalLeadTimeMs) * 1000) / 10
        : 0,
    formattedAvgCycleTime: formatDurationMs(simulatedAvgCycleTimeMs),
    formattedAvgProcessingTime: formatDurationMs(simulatedAvgCaseProcessingTimeMs),
    formattedAvgWaitingTime: formatDurationMs(simulatedAvgCaseWaitingTimeMs),
    formattedTotalProcessingTime: formatDurationMs(simulatedTotalProcessingMs),
    formattedTotalWaitingTime: formatDurationMs(simulatedTotalWaitingMs),
  };

  // 5. Recalculate Bottlenecks using exact same analytical engine
  const simulatedBottlenecks = calculateBottleneckCandidates(
    simulatedStages,
    simulatedMetrics,
    {
      resourceMetrics: baselineAnalysis.resources,
      peakAnalysis: baselineAnalysis.peakAnalysis,
    }
  );

  // 6. Detect Bottleneck Migration
  const migration = detectBottleneckMigration(baselineBottlenecks, simulatedBottlenecks);

  // 7. Assemble Stage-by-Stage Comparison
  const baselineStageMap = new Map<string, StageMetrics>(
    baselineStages.map((s) => [s.stageName, s])
  );
  const baselineRankMap = new Map<string, number>(
    baselineBottlenecks.map((b) => [b.stageName, b.rank])
  );
  const baselineScoreMap = new Map<string, number>(
    baselineBottlenecks.map((b) => [b.stageName, b.delayContributionScore])
  );
  const baselineDNAMap = new Map(
    baselineBottlenecks.map((b) => [b.stageName, b.dna])
  );

  const simulatedRankMap = new Map<string, number>(
    simulatedBottlenecks.map((b) => [b.stageName, b.rank])
  );
  const simulatedScoreMap = new Map<string, number>(
    simulatedBottlenecks.map((b) => [b.stageName, b.delayContributionScore])
  );
  const simulatedDNAMap = new Map(
    simulatedBottlenecks.map((b) => [b.stageName, b.dna])
  );

  const stageResults: StageSimulationResult[] = simulatedStages.map((simStage) => {
    const baseStage = baselineStageMap.get(simStage.stageName)!;
    const baseRank = baselineRankMap.get(simStage.stageName) ?? simulatedStages.length;
    const simRank = simulatedRankMap.get(simStage.stageName) ?? simulatedStages.length;
    const baseScore = baselineScoreMap.get(simStage.stageName) ?? 0;
    const simScore = simulatedScoreMap.get(simStage.stageName) ?? 0;

    const procRedMs = Math.max(0, baseStage.totalProcessingTimeMs - simStage.totalProcessingTimeMs);
    const procRedPct =
      baseStage.totalProcessingTimeMs > 0
        ? Math.round((procRedMs / baseStage.totalProcessingTimeMs) * 1000) / 10
        : 0;

    const waitRedMs = Math.max(0, baseStage.totalWaitingTimeMs - simStage.totalWaitingTimeMs);
    const waitRedPct =
      baseStage.totalWaitingTimeMs > 0
        ? Math.round((waitRedMs / baseStage.totalWaitingTimeMs) * 1000) / 10
        : 0;

    return {
      stageName: simStage.stageName,
      baselineProcessingTimeMs: baseStage.totalProcessingTimeMs,
      simulatedProcessingTimeMs: simStage.totalProcessingTimeMs,
      processingTimeReductionMs: procRedMs,
      processingTimeReductionPercent: procRedPct,
      baselineWaitingTimeMs: baseStage.totalWaitingTimeMs,
      simulatedWaitingTimeMs: simStage.totalWaitingTimeMs,
      waitingTimeReductionMs: waitRedMs,
      waitingTimeReductionPercent: waitRedPct,
      baselineScore: baseScore,
      simulatedScore: simScore,
      scoreChange: Math.round((simScore - baseScore) * 10) / 10,
      baselineRank: baseRank,
      simulatedRank: simRank,
      rankChange: simRank - baseRank,
      baselineProcessingContributionPct: baseStage.processingContributionPct,
      simulatedProcessingContributionPct: simStage.processingContributionPct,
      baselineWaitingContributionPct: baseStage.waitingContributionPct,
      simulatedWaitingContributionPct: simStage.waitingContributionPct,
      baselineDNA: baselineDNAMap.get(simStage.stageName)!,
      simulatedDNA: simulatedDNAMap.get(simStage.stageName)!,
      formattedBaselineAvgProcessing: baseStage.formattedAvgProcessingTime,
      formattedSimulatedAvgProcessing: simStage.formattedAvgProcessingTime,
      formattedBaselineAvgWaiting: baseStage.formattedAvgWaitingTime,
      formattedSimulatedAvgWaiting: simStage.formattedAvgWaitingTime,
    };
  });

  // Sort stageResults by baseline rank for consistent presentation
  stageResults.sort((a, b) => a.baselineRank - b.baselineRank);

  // 8. Overall Comparison
  const cycleTimeReductionMs = Math.max(
    0,
    baselineMetrics.avgCaseCycleTimeMs - simulatedMetrics.avgCaseCycleTimeMs
  );
  const cycleTimeReductionPercent =
    baselineMetrics.avgCaseCycleTimeMs > 0
      ? Math.round((cycleTimeReductionMs / baselineMetrics.avgCaseCycleTimeMs) * 1000) / 10
      : 0;

  const processingReductionMs = Math.max(
    0,
    baselineMetrics.totalProcessProcessingTimeMs - simulatedMetrics.totalProcessProcessingTimeMs
  );
  const processingReductionPercent =
    baselineMetrics.totalProcessProcessingTimeMs > 0
      ? Math.round(
          (processingReductionMs / baselineMetrics.totalProcessProcessingTimeMs) * 1000
        ) / 10
      : 0;

  const waitingReductionMs = Math.max(
    0,
    baselineMetrics.totalProcessWaitingTimeMs - simulatedMetrics.totalProcessWaitingTimeMs
  );
  const waitingReductionPercent =
    baselineMetrics.totalProcessWaitingTimeMs > 0
      ? Math.round((waitingReductionMs / baselineMetrics.totalProcessWaitingTimeMs) * 1000) / 10
      : 0;

  const comparison: SimulationComparison = {
    baselineCycleTimeMs: baselineMetrics.avgCaseCycleTimeMs,
    simulatedCycleTimeMs: simulatedMetrics.avgCaseCycleTimeMs,
    cycleTimeReductionMs,
    cycleTimeReductionPercent,
    baselineProcessingTimeMs: baselineMetrics.totalProcessProcessingTimeMs,
    simulatedProcessingTimeMs: simulatedMetrics.totalProcessProcessingTimeMs,
    processingReductionMs,
    processingReductionPercent,
    baselineWaitingTimeMs: baselineMetrics.totalProcessWaitingTimeMs,
    simulatedWaitingTimeMs: simulatedMetrics.totalProcessWaitingTimeMs,
    waitingReductionMs,
    waitingReductionPercent,

    baselineAvgCaseWaitingTimeMs: baselineMetrics.avgCaseWaitingTimeMs,
    simulatedAvgCaseWaitingTimeMs: simulatedMetrics.avgCaseWaitingTimeMs,
    baselineAvgCaseProcessingTimeMs: baselineMetrics.avgCaseProcessingTimeMs,
    simulatedAvgCaseProcessingTimeMs: simulatedMetrics.avgCaseProcessingTimeMs,

    baselineBottleneckStage: baselineBottlenecks[0]?.stageName ?? "None",
    simulatedBottleneckStage: simulatedBottlenecks[0]?.stageName ?? "None",
    baselineBottleneckScore: baselineBottlenecks[0]?.delayContributionScore ?? 0,
    simulatedBottleneckScore: simulatedBottlenecks[0]?.delayContributionScore ?? 0,

    formattedBaselineCycleTime: baselineMetrics.formattedAvgCycleTime,
    formattedSimulatedCycleTime: simulatedMetrics.formattedAvgCycleTime,
    formattedBaselineAvgCaseWaiting: baselineMetrics.formattedAvgWaitingTime,
    formattedSimulatedAvgCaseWaiting: simulatedMetrics.formattedAvgWaitingTime,
    formattedBaselineAvgCaseProcessing: baselineMetrics.formattedAvgProcessingTime,
    formattedSimulatedAvgCaseProcessing: simulatedMetrics.formattedAvgProcessingTime,
    formattedBaselineWaitingTime: baselineMetrics.formattedTotalWaitingTime,
    formattedSimulatedWaitingTime: simulatedMetrics.formattedTotalWaitingTime,
    formattedBaselineProcessingTime: baselineMetrics.formattedTotalProcessingTime,
    formattedSimulatedProcessingTime: simulatedMetrics.formattedTotalProcessingTime,
  };

  // 9. Measurable Intervention Outcomes
  const outcomes: SimulationOutcome[] = scenario.interventions.map((intervention) => {
    const stageRes = stageResults.find((s) => s.stageName === intervention.stage);
    return {
      intervention,
      projectedCycleTimeReductionPercent: cycleTimeReductionPercent,
      projectedWaitingReductionPercent: stageRes?.waitingTimeReductionPercent ?? 0,
      projectedProcessingReductionPercent: stageRes?.processingTimeReductionPercent ?? 0,
      bottleneckScoreReduction: stageRes ? Math.abs(stageRes.scoreChange) : 0,
      migrationDetected: migration.migrated,
      newBottleneckStage: migration.toStage,
    };
  });

  // 10. Structured Explanation Payload for Future Gemini
  const explanationPayload: SimulationExplanationPayload = {
    scenario,
    baselineSummary: {
      cycleTimeMs: baselineMetrics.avgCaseCycleTimeMs,
      bottleneckStage: baselineBottlenecks[0]?.stageName ?? "None",
      bottleneckScore: baselineBottlenecks[0]?.delayContributionScore ?? 0,
      bottleneckFactor: baselineBottlenecks[0]?.dna.primaryFactor ?? "PROCESSING",
    },
    simulatedSummary: {
      cycleTimeMs: simulatedMetrics.avgCaseCycleTimeMs,
      bottleneckStage: simulatedBottlenecks[0]?.stageName ?? "None",
      bottleneckScore: simulatedBottlenecks[0]?.delayContributionScore ?? 0,
      bottleneckFactor: simulatedBottlenecks[0]?.dna.primaryFactor ?? "PROCESSING",
    },
    improvement: {
      cycleTimeReductionPct: cycleTimeReductionPercent,
      waitingReductionPct: waitingReductionPercent,
      processingReductionPct: processingReductionPercent,
    },
    migration,
    evidence: {
      stageOutcomes: stageResults.map((s) => ({
        stageName: s.stageName,
        baselineScore: s.baselineScore,
        simulatedScore: s.simulatedScore,
        rankChange: s.rankChange,
        primaryFactor: s.simulatedDNA.primaryFactor,
      })),
    },
    assumptions: SIMULATION_ASSUMPTIONS.map((a) => `${a.title}: ${a.statement}`),
  };

  return {
    scenario,
    baselineMetrics,
    simulatedMetrics,
    baselineStages,
    simulatedStages,
    baselineBottlenecks,
    simulatedBottlenecks,
    stageResults,
    comparison,
    migration,
    assumptions: SIMULATION_ASSUMPTIONS,
    explanationPayload,
    outcomes,
  };
}
