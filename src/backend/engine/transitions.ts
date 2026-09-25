/**
 * FlowLens AI - Stage Transition Analytics
 * Phase 2: Bottleneck DNA Intelligence & Root Cause Analysis
 *
 * Reconstructs stage-to-stage handoffs across all cases and tracks
 * queue formation between upstream and downstream stages.
 */

import { ProcessCase, StageTransition } from "@/shared/types";
import { calculateMean, calculateMedian, formatDurationMs } from "./time-utils";

/**
 * Calculates stage-to-stage transition metrics (Stage A -> Stage B)
 * across all reconstructed process cases.
 */
export function calculateStageTransitions(cases: ProcessCase[]): StageTransition[] {
  const transitionMap = new Map<
    string,
    {
      fromStage: string;
      toStage: string;
      waitTimes: number[];
    }
  >();

  for (const procCase of cases) {
    const events = procCase.events;
    if (events.length < 2) continue;

    for (let i = 0; i < events.length - 1; i++) {
      const fromStage = events[i].activity;
      const toStage = events[i + 1].activity;
      // Waiting time before toStage (elapsed since fromStage completed)
      const rawWait = events[i + 1].startTimestamp - events[i].endTimestamp;
      const waitTime = Math.max(0, rawWait);

      const key = `${fromStage} -> ${toStage}`;
      let item = transitionMap.get(key);
      if (!item) {
        item = { fromStage, toStage, waitTimes: [] };
        transitionMap.set(key, item);
      }
      item.waitTimes.push(waitTime);
    }
  }

  const transitions: StageTransition[] = [];

  for (const item of transitionMap.values()) {
    const count = item.waitTimes.length;
    const totalWait = item.waitTimes.reduce((a, b) => a + b, 0);
    const avgWait = calculateMean(item.waitTimes);
    const medianWait = calculateMedian(item.waitTimes);
    const minWait = count > 0 ? Math.min(...item.waitTimes) : 0;
    const maxWait = count > 0 ? Math.max(...item.waitTimes) : 0;

    transitions.push({
      fromStage: item.fromStage,
      toStage: item.toStage,
      transitionCount: count,
      avgWaitTimeMs: avgWait,
      medianWaitTimeMs: medianWait,
      minWaitTimeMs: minWait,
      maxWaitTimeMs: maxWait,
      totalWaitTimeMs: totalWait,
      formattedAvgWaitTime: formatDurationMs(avgWait),
      formattedTotalWaitTime: formatDurationMs(totalWait),
    });
  }

  // Sort transitions by total accumulated waiting time descending
  transitions.sort((a, b) => b.totalWaitTimeMs - a.totalWaitTimeMs);

  return transitions;
}

/**
 * Retrieves all transitions feeding into a specific stage (upstream handoffs)
 */
export function getUpstreamTransitions(
  stageName: string,
  transitions: StageTransition[]
): StageTransition[] {
  return transitions.filter((t) => t.toStage === stageName);
}

/**
 * Retrieves all transitions leaving a specific stage (downstream handoffs)
 */
export function getDownstreamTransitions(
  stageName: string,
  transitions: StageTransition[]
): StageTransition[] {
  return transitions.filter((t) => t.fromStage === stageName);
}
