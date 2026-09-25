/**
 * FlowLens AI - Process Case Reconstruction Engine
 * Phase 1: Event Data Engine
 */

import { NormalizedEvent, ProcessCase, DataQualityIssue } from "@/shared/types";

export interface CaseReconstructionResult {
  cases: ProcessCase[];
  dataQualityIssues: DataQualityIssue[];
}

/**
 * Groups events by Case ID, reconstructs chronological execution paths,
 * and calculates individual case durations and waiting times.
 */
export function reconstructProcessCases(
  events: NormalizedEvent[]
): CaseReconstructionResult {
  const casesMap = new Map<string, NormalizedEvent[]>();
  const dataQualityIssues: DataQualityIssue[] = [];

  // Group events by caseId in O(N)
  for (const event of events) {
    let caseEvents = casesMap.get(event.caseId);
    if (!caseEvents) {
      caseEvents = [];
      casesMap.set(event.caseId, caseEvents);
    }
    caseEvents.push(event);
  }

  const reconstructedCases: ProcessCase[] = [];

  for (const [caseId, caseEvents] of casesMap.entries()) {
    // Sort chronologically by startTimestamp, tie-breaker endTimestamp
    caseEvents.sort((a, b) => {
      if (a.startTimestamp !== b.startTimestamp) {
        return a.startTimestamp - b.startTimestamp;
      }
      return a.endTimestamp - b.endTimestamp;
    });

    let totalProcessingTimeMs = 0;
    let totalWaitingTimeMs = 0;
    const stageSequence: string[] = [];

    for (let i = 0; i < caseEvents.length; i++) {
      const current = caseEvents[i];
      stageSequence.push(current.activity);
      totalProcessingTimeMs += current.processingTimeMs;

      if (i === 0) {
        // First stage in case has no prior waiting time
        current.waitingTimeMs = 0;
      } else {
        const previous = caseEvents[i - 1];
        const waitDiff = current.startTimestamp - previous.endTimestamp;

        if (waitDiff < 0) {
          // Negative waiting time indicates overlapping/parallel execution
          const overlapDuration = Math.abs(waitDiff);
          current.waitingTimeMs = 0; // Clamped for non-negative waiting calculation
          dataQualityIssues.push({
            caseId,
            activity: current.activity,
            rowIndex: current.rowIndex,
            type: "OVERLAPPING_EVENTS",
            message: `Case ${caseId}: Activity "${current.activity}" starts ${overlapDuration}ms before prior activity "${previous.activity}" completed. Overlap detected.`,
            severity: "warning",
            overlapMs: overlapDuration,
          });
        } else {
          current.waitingTimeMs = waitDiff;
          totalWaitingTimeMs += waitDiff;
        }
      }

      if (current.processingTimeMs === 0) {
        dataQualityIssues.push({
          caseId,
          activity: current.activity,
          rowIndex: current.rowIndex,
          type: "ZERO_DURATION",
          message: `Case ${caseId}: Activity "${current.activity}" has zero duration (start_time == end_time).`,
          severity: "info",
        });
      }
    }

    const firstEvent = caseEvents[0];
    const lastEvent = caseEvents[caseEvents.length - 1];

    const caseStartTimestamp = firstEvent.startTimestamp;
    // The case end is the maximum endTimestamp observed among all case events
    let caseEndTimestamp = firstEvent.endTimestamp;
    for (const ev of caseEvents) {
      if (ev.endTimestamp > caseEndTimestamp) {
        caseEndTimestamp = ev.endTimestamp;
      }
    }

    const cycleTimeMs = caseEndTimestamp - caseStartTimestamp;

    reconstructedCases.push({
      caseId,
      events: caseEvents,
      eventCount: caseEvents.length,
      caseStart: firstEvent.startTime,
      caseEnd: lastEvent.endTime,
      caseStartTimestamp,
      caseEndTimestamp,
      cycleTimeMs,
      totalProcessingTimeMs,
      totalWaitingTimeMs,
      firstStage: firstEvent.activity,
      finalStage: lastEvent.activity,
      stageSequence,
    });
  }

  // Sort reconstructed cases chronologically by caseStartTimestamp
  reconstructedCases.sort((a, b) => a.caseStartTimestamp - b.caseStartTimestamp);

  return {
    cases: reconstructedCases,
    dataQualityIssues,
  };
}
