/**
 * FlowLens AI - Stage & Process Analytics Engine
 * Phase 1: Event Data Engine
 */

import { NormalizedEvent, ProcessCase, StageMetrics, ProcessMetrics } from "@/shared/types";
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  formatDurationMs,
} from "./time-utils";

export interface StageAggregationResult {
  stages: StageMetrics[];
  processMetrics: ProcessMetrics;
}

/**
 * Aggregates normalized events across activities and computes comprehensive process-wide metrics.
 */
export function aggregateStageAndProcessMetrics(
  events: NormalizedEvent[],
  cases: ProcessCase[]
): StageAggregationResult {
  const stageGroups = new Map<
    string,
    {
      processingTimes: number[];
      waitingTimes: number[];
      casesSet: Set<string>;
    }
  >();

  let totalProcessProcessingTimeMs = 0;
  let totalProcessWaitingTimeMs = 0;

  for (const event of events) {
    let group = stageGroups.get(event.activity);
    if (!group) {
      group = {
        processingTimes: [],
        waitingTimes: [],
        casesSet: new Set<string>(),
      };
      stageGroups.set(event.activity, group);
    }

    group.processingTimes.push(event.processingTimeMs);
    group.waitingTimes.push(event.waitingTimeMs);
    group.casesSet.add(event.caseId);

    totalProcessProcessingTimeMs += event.processingTimeMs;
    totalProcessWaitingTimeMs += event.waitingTimeMs;
  }

  // Calculate ProcessMetrics
  const cycleTimes = cases.map((c) => c.cycleTimeMs);
  const totalProcessLeadTime = totalProcessProcessingTimeMs + totalProcessWaitingTimeMs;

  const caseCount = cases.length;
  const avgCaseProcessingTimeMs =
    caseCount > 0 ? Math.round(totalProcessProcessingTimeMs / caseCount) : 0;
  const avgCaseWaitingTimeMs =
    caseCount > 0 ? Math.round(totalProcessWaitingTimeMs / caseCount) : 0;

  const processMetrics: ProcessMetrics = {
    totalCases: caseCount,
    totalEvents: events.length,
    uniqueStagesCount: stageGroups.size,
    avgCaseCycleTimeMs: calculateMean(cycleTimes),
    medianCaseCycleTimeMs: calculateMedian(cycleTimes),
    minCaseCycleTimeMs: cycleTimes.length > 0 ? Math.min(...cycleTimes) : 0,
    maxCaseCycleTimeMs: cycleTimes.length > 0 ? Math.max(...cycleTimes) : 0,
    totalProcessProcessingTimeMs,
    totalProcessWaitingTimeMs,
    avgCaseProcessingTimeMs,
    avgCaseWaitingTimeMs,
    avgProcessEfficiencyPct:
      totalProcessLeadTime > 0
        ? Math.round((totalProcessProcessingTimeMs / totalProcessLeadTime) * 1000) / 10
        : 0,
    formattedAvgCycleTime: formatDurationMs(calculateMean(cycleTimes)),
    formattedAvgProcessingTime: formatDurationMs(avgCaseProcessingTimeMs),
    formattedAvgWaitingTime: formatDurationMs(avgCaseWaitingTimeMs),
    formattedTotalProcessingTime: formatDurationMs(totalProcessProcessingTimeMs),
    formattedTotalWaitingTime: formatDurationMs(totalProcessWaitingTimeMs),
  };

  // Build StageMetrics for each activity
  const stages: StageMetrics[] = [];

  for (const [stageName, data] of stageGroups.entries()) {
    const eventCount = data.processingTimes.length;
    const totalProcessing = data.processingTimes.reduce((a, b) => a + b, 0);
    const avgProcessing = calculateMean(data.processingTimes);
    const medianProcessing = calculateMedian(data.processingTimes);
    const minProcessing = Math.min(...data.processingTimes);
    const maxProcessing = Math.max(...data.processingTimes);
    const stdDevProcessing = calculateStdDev(data.processingTimes, avgProcessing);
    const varianceProcessing = Math.pow(stdDevProcessing, 2);

    const totalWaiting = data.waitingTimes.reduce((a, b) => a + b, 0);
    const avgWaiting = calculateMean(data.waitingTimes);
    const medianWaiting = calculateMedian(data.waitingTimes);
    const minWaiting = Math.min(...data.waitingTimes);
    const maxWaiting = Math.max(...data.waitingTimes);

    // Contribution percentages (0 - 100)
    const processingContributionPct =
      totalProcessProcessingTimeMs > 0
        ? (totalProcessing / totalProcessProcessingTimeMs) * 100
        : 0;

    const waitingContributionPct =
      totalProcessWaitingTimeMs > 0
        ? (totalWaiting / totalProcessWaitingTimeMs) * 100
        : 0;

    const stageTotalTime = totalProcessing + totalWaiting;
    const cycleContributionPct =
      totalProcessLeadTime > 0
        ? (stageTotalTime / totalProcessLeadTime) * 100
        : 0;

    stages.push({
      stageName,
      eventCount,
      uniqueCaseCount: data.casesSet.size,
      totalProcessingTimeMs: totalProcessing,
      avgProcessingTimeMs: avgProcessing,
      medianProcessingTimeMs: medianProcessing,
      minProcessingTimeMs: minProcessing,
      maxProcessingTimeMs: maxProcessing,
      processingTimeVariance: Math.round(varianceProcessing * 100) / 100,
      processingTimeStdDev: Math.round(stdDevProcessing * 100) / 100,
      totalWaitingTimeMs: totalWaiting,
      avgWaitingTimeMs: avgWaiting,
      medianWaitingTimeMs: medianWaiting,
      minWaitingTimeMs: minWaiting,
      maxWaitingTimeMs: maxWaiting,
      processingContributionPct: Math.round(processingContributionPct * 10) / 10,
      waitingContributionPct: Math.round(waitingContributionPct * 10) / 10,
      cycleContributionPct: Math.round(cycleContributionPct * 10) / 10,
      formattedAvgProcessingTime: formatDurationMs(avgProcessing),
      formattedAvgWaitingTime: formatDurationMs(avgWaiting),
      formattedTotalProcessingTime: formatDurationMs(totalProcessing),
      formattedTotalWaitingTime: formatDurationMs(totalWaiting),
    });
  }

  // Sort stages by total duration impact descending
  stages.sort(
    (a, b) =>
      b.totalProcessingTimeMs + b.totalWaitingTimeMs - (a.totalProcessingTimeMs + a.totalWaitingTimeMs)
  );

  return {
    stages,
    processMetrics,
  };
}
