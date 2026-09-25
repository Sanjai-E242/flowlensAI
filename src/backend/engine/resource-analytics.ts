/**
 * FlowLens AI - Resource Analytics & Workload Intelligence
 * Phase 2: Bottleneck DNA Intelligence & Root Cause Analysis
 */

import { NormalizedEvent, ResourceMetrics } from "@/shared/types";
import { calculateMean, calculateMedian, formatDurationMs } from "./time-utils";
import { RESOURCE_ANALYSIS_CONFIG } from "./constants";

/**
 * Computes comprehensive operational and workload statistics for resources.
 * If resource_id is omitted or null in events, gracefully skips unassigned events.
 */
export function calculateResourceMetrics(
  events: NormalizedEvent[],
  totalProcessProcessingTimeMs?: number
): ResourceMetrics[] {
  const resourceMap = new Map<
    string,
    {
      processingTimes: number[];
      waitingTimes: number[];
      casesSet: Set<string>;
      stageCountMap: Map<string, number>;
    }
  >();

  // Count overall stage frequencies for concentration analysis
  const totalStageCounts = new Map<string, number>();
  let totalProcessing = 0;

  for (const event of events) {
    totalProcessing += event.processingTimeMs;
    totalStageCounts.set(
      event.activity,
      (totalStageCounts.get(event.activity) || 0) + 1
    );

    if (!event.resourceId) continue;

    let res = resourceMap.get(event.resourceId);
    if (!res) {
      res = {
        processingTimes: [],
        waitingTimes: [],
        casesSet: new Set<string>(),
        stageCountMap: new Map<string, number>(),
      };
      resourceMap.set(event.resourceId, res);
    }

    res.processingTimes.push(event.processingTimeMs);
    res.waitingTimes.push(event.waitingTimeMs);
    res.casesSet.add(event.caseId);
    res.stageCountMap.set(
      event.activity,
      (res.stageCountMap.get(event.activity) || 0) + 1
    );
  }

  const effectiveTotalProcessingMs =
    totalProcessProcessingTimeMs && totalProcessProcessingTimeMs > 0
      ? totalProcessProcessingTimeMs
      : totalProcessing > 0
      ? totalProcessing
      : 1;

  const totalEvents = events.length > 0 ? events.length : 1;
  const uniqueResourceCount = resourceMap.size;

  // Calculate average resource workload for relative ratio comparison
  let totalResourceProcessingSum = 0;
  for (const data of resourceMap.values()) {
    totalResourceProcessingSum += data.processingTimes.reduce((a, b) => a + b, 0);
  }
  const avgResourceProcessingMs =
    uniqueResourceCount > 0 ? totalResourceProcessingSum / uniqueResourceCount : 0;

  const metrics: ResourceMetrics[] = [];

  for (const [resourceId, data] of resourceMap.entries()) {
    const resourceTotalProc = data.processingTimes.reduce((a, b) => a + b, 0);
    const resourceTotalWait = data.waitingTimes.reduce((a, b) => a + b, 0);
    const avgProcessing = calculateMean(data.processingTimes);
    const medianProcessing = calculateMedian(data.processingTimes);

    const workloadSharePct =
      Math.round((resourceTotalProc / effectiveTotalProcessingMs) * 1000) / 10;
    const eventSharePct =
      Math.round((data.processingTimes.length / totalEvents) * 1000) / 10;

    const workloadRatioToAvg =
      avgResourceProcessingMs > 0
        ? Math.round((resourceTotalProc / avgResourceProcessingMs) * 100) / 100
        : 1.0;

    // Evaluate overload signals with non-causal "associated with" language
    const overloadReasons: string[] = [];

    if (workloadRatioToAvg >= RESOURCE_ANALYSIS_CONFIG.OVERLOAD_WORKLOAD_RATIO) {
      overloadReasons.push(
        `Associated with high processing workload (${Math.round(
          workloadRatioToAvg * 100
        )}% of average resource duration)`
      );
    }

    // Check concentration in specific stages
    for (const [stage, count] of data.stageCountMap.entries()) {
      const stageTotal = totalStageCounts.get(stage) || 1;
      const concentrationPct = (count / stageTotal) * 100;
      if (
        concentrationPct >= RESOURCE_ANALYSIS_CONFIG.STAGE_CONCENTRATION_PCT &&
        stageTotal >= 3
      ) {
        overloadReasons.push(
          `Associated with ${Math.round(
            concentrationPct
          )}% of all executions in stage "${stage}"`
        );
      }
    }

    const isOverloaded = overloadReasons.length > 0;

    metrics.push({
      resourceId,
      eventsHandled: data.processingTimes.length,
      uniqueCases: data.casesSet.size,
      totalProcessingTimeMs: resourceTotalProc,
      avgProcessingTimeMs: avgProcessing,
      medianProcessingTimeMs: medianProcessing,
      stagesHandled: Array.from(data.stageCountMap.keys()),
      workloadSharePct,
      eventSharePct,
      workloadRatioToAvg,
      associatedWaitingTimeMs: resourceTotalWait,
      isOverloaded,
      overloadReasons,
      formattedAvgProcessingTime: formatDurationMs(avgProcessing),
      formattedTotalProcessingTime: formatDurationMs(resourceTotalProc),
    });
  }

  // Sort primarily by workload share descending, then by events handled
  metrics.sort((a, b) => b.totalProcessingTimeMs - a.totalProcessingTimeMs);

  return metrics;
}

