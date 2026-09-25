/**
 * FlowLens AI - Deterministic Root Cause Attribution & Explanation Engine
 * Phase 2: Bottleneck DNA Intelligence & Root Cause Analysis
 *
 * Produces structured, metric-grounded evidence attributing the root factors
 * behind process bottlenecks without relying on machine learning or LLMs.
 */

import {
  BottleneckCandidate,
  BottleneckEvidence,
  NormalizedEvent,
  PeakAnalysisResult,
  ResourceMetrics,
  RootCauseAttribution,
  StageMetrics,
  StageTransition,
} from "@/shared/types";
import { getDownstreamTransitions, getUpstreamTransitions } from "./transitions";

/**
 * Builds a deterministic Root Cause Attribution object for a given bottleneck stage.
 */
export function buildRootCauseAttribution(
  candidate: BottleneckCandidate,
  resources: ResourceMetrics[],
  transitions: StageTransition[],
  peakAnalysis: PeakAnalysisResult,
  events: NormalizedEvent[]
): RootCauseAttribution {
  const stageName = candidate.stageName;
  const stageMetrics = candidate.stageMetrics;
  const dna = candidate.dna;

  // Upstream handoffs feeding this stage
  const upstream = getUpstreamTransitions(stageName, transitions);
  const primaryUpstream = upstream.length > 0 ? upstream[0] : undefined;

  // Downstream handoffs departing this stage
  const downstream = getDownstreamTransitions(stageName, transitions);
  const primaryDownstream = downstream.length > 0 ? downstream[0] : undefined;

  // Resources handling this stage
  const stageResources = resources.filter((r) =>
    r.stagesHandled.includes(stageName)
  );
  const associatedResourceIds = stageResources.map((r) => r.resourceId);
  const overloadedResource = stageResources.find((r) => r.isOverloaded);
  const topResource = stageResources[0];

  // Peak period association
  const stageEvents = events.filter((e) => e.activity === stageName);
  let dominantPeakHour: string | undefined;
  if (peakAnalysis.peakHours.length > 0 && stageEvents.length > 0) {
    const peakHourCounts = new Map<number, number>();
    for (const ev of stageEvents) {
      const h = new Date(ev.startTimestamp).getUTCHours();
      peakHourCounts.set(h, (peakHourCounts.get(h) || 0) + 1);
    }
    let maxCount = 0;
    let bestHour = -1;
    for (const [h, count] of peakHourCounts.entries()) {
      const isPeak = peakAnalysis.hourlyBuckets.some(
        (b) => b.hour === h && b.isPeak
      );
      if (isPeak && count > maxCount) {
        maxCount = count;
        bestHour = h;
      }
    }
    if (bestHour !== -1) {
      dominantPeakHour = `${bestHour.toString().padStart(2, "0")}:00 - ${(
        (bestHour + 1) % 24
      )
        .toString()
        .padStart(2, "0")}:00`;
    }
  }

  // Generate metric-grounded deterministic interpretation text
  let interpretation = "";
  if (dna.primaryFactor === "WAITING") {
    interpretation = `Most delay associated with stage "${stageName}" (${stageMetrics.waitingContributionPct}% of process waiting time) occurs in queue before processing begins, accumulating ${stageMetrics.formattedAvgWaitingTime} average inter-stage delay.`;
    if (primaryUpstream) {
      interpretation += ` Waiting accumulates primarily during handoff from upstream stage "${primaryUpstream.fromStage}".`;
    }
  } else if (dna.primaryFactor === "PROCESSING") {
    interpretation = `Active execution duration is the primary constraint in stage "${stageName}", accounting for ${stageMetrics.processingContributionPct}% of total process work time with an average execution duration of ${stageMetrics.formattedAvgProcessingTime}.`;
  } else if (dna.primaryFactor === "RESOURCE") {
    interpretation = `Delay in stage "${stageName}" is associated with concentrated workload on resource ${
      overloadedResource?.resourceId || topResource?.resourceId || "operator"
    }, handling high stage concentration.`;
  } else if (dna.primaryFactor === "PEAK") {
    interpretation = `Activity in stage "${stageName}" is concentrated during operational peak windows (${
      dominantPeakHour || peakAnalysis.dominantArrivalWindow
    }), exacerbating queue arrival delays.`;
  } else if (dna.primaryFactor === "VARIABILITY") {
    interpretation = `High duration volatility (StdDev: ${Math.round(
      stageMetrics.processingTimeStdDev / 1000
    )}s) in stage "${stageName}" destabilizes workflow predictability and leads to irregular case cycle times.`;
  } else {
    interpretation = `High transaction volume (${stageMetrics.eventCount} executions) creates cumulative friction across process completion times.`;
  }

  return {
    stage: stageName,
    primaryCause: dna.primaryFactor,
    supportingSignals: dna.tags,
    evidence: {
      waitingContributionPct: stageMetrics.waitingContributionPct,
      processingContributionPct: stageMetrics.processingContributionPct,
      cycleContributionPct: stageMetrics.cycleContributionPct,
      dominantPeakHour,
      associatedResources: associatedResourceIds,
      resourceWorkloadSharePct: topResource?.workloadSharePct,
      upstreamStage: primaryUpstream?.fromStage,
      downstreamStage: primaryDownstream?.toStage,
      upstreamAvgWaitMs: primaryUpstream?.avgWaitTimeMs,
    },
    interpretation,
  };
}

/**
 * Builds the complete deterministic explanation payload for a bottleneck candidate.
 * This payload is designed to be cleanly consumable by future LLM (Gemini) explanation layers.
 */
export function buildBottleneckEvidencePayload(
  candidate: BottleneckCandidate,
  allStages: StageMetrics[],
  resources: ResourceMetrics[],
  transitions: StageTransition[],
  peakAnalysis: PeakAnalysisResult,
  events: NormalizedEvent[]
): BottleneckEvidence {
  const rootCause = buildRootCauseAttribution(
    candidate,
    resources,
    transitions,
    peakAnalysis,
    events
  );

  const stageName = candidate.stageName;

  // Upstream evidence
  const upstream = getUpstreamTransitions(stageName, transitions).map((t) => ({
    fromStage: t.fromStage,
    transitionCount: t.transitionCount,
    avgWaitMs: t.avgWaitTimeMs,
    formattedAvgWait: t.formattedAvgWaitTime,
  }));

  // Downstream evidence
  const downstream = getDownstreamTransitions(stageName, transitions).map(
    (t) => ({
      toStage: t.toStage,
      transitionCount: t.transitionCount,
      avgWaitMs: t.avgWaitTimeMs,
      formattedAvgWait: t.formattedAvgWaitTime,
    })
  );

  // Resource evidence
  const stageResources = resources
    .filter((r) => r.stagesHandled.includes(stageName))
    .map((r) => ({
      resourceId: r.resourceId,
      eventsHandled: r.eventsHandled,
      workloadSharePct: r.workloadSharePct,
      note: `Handled ${r.eventsHandled} events (${r.workloadSharePct}% total process workload)${
        r.isOverloaded ? " — associated with overload threshold" : ""
      }`,
    }));

  // Peak evidence
  const peakEvidence: Array<{
    period: string;
    volumeSharePct: number;
    note: string;
  }> = [];

  for (const b of peakAnalysis.hourlyBuckets.filter((b) => b.isPeak)) {
    const stageEventsInHour = events.filter(
      (e) =>
        e.activity === stageName &&
        new Date(e.startTimestamp).getUTCHours() === b.hour
    );
    if (stageEventsInHour.length > 0) {
      const sharePct =
        Math.round((stageEventsInHour.length / candidate.stageMetrics.eventCount) * 1000) / 10;
      peakEvidence.push({
        period: b.hourLabel,
        volumeSharePct: sharePct,
        note: `${stageEventsInHour.length} stage executions (${sharePct}% of stage volume) occurred during this peak hour.`,
      });
    }
  }

  return {
    stage: stageName,
    rank: candidate.rank,
    score: candidate.delayContributionScore,
    why: {
      primary: candidate.dna.primaryFactor,
      processingContribution: candidate.processingScore,
      waitingContribution: candidate.waitingScore,
    },
    dna: candidate.dna,
    rootCause,
    signalCoverage: "High (6/6 signals analyzed: WAITING, PROCESSING, VARIABILITY, VOLUME, RESOURCE, PEAK)",
    resourceEvidence: stageResources,
    peakEvidence,
    upstreamEvidence: upstream,
    downstreamEvidence: downstream,
  };
}
