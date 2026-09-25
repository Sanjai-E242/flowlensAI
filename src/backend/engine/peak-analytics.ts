/**
 * FlowLens AI - Peak-Time Analytics
 * Phase 2: Bottleneck DNA Intelligence & Root Cause Analysis
 *
 * Evaluates hourly and temporal arrival patterns to detect peak traffic periods
 * and associate temporal volume surges with observed queue delays.
 */

import { NormalizedEvent, ProcessCase, TimeBucketMetrics, PeakAnalysisResult } from "@/shared/types";
import { calculateMean, formatDurationMs } from "./time-utils";
import { PEAK_ANALYSIS_CONFIG } from "./constants";

export interface PeakAnalysisOptions {
  peakThresholdRatio?: number;
}

/**
 * Performs deterministic time-bucket analysis across all 24 hours of the day.
 */
export function calculatePeakAnalytics(
  events: NormalizedEvent[],
  cases: ProcessCase[],
  options?: PeakAnalysisOptions
): PeakAnalysisResult {
  const thresholdRatio =
    options?.peakThresholdRatio ?? PEAK_ANALYSIS_CONFIG.PEAK_THRESHOLD_RATIO;

  // Initialize 24 hourly buckets (00:00 to 23:00)
  const hourlyData: Array<{
    hour: number;
    hourLabel: string;
    eventCount: number;
    caseArrivals: number;
    procTimes: number[];
    waitTimes: number[];
  }> = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    hourLabel: `${i.toString().padStart(2, "0")}:00 - ${((i + 1) % 24)
      .toString()
      .padStart(2, "0")}:00`,
    eventCount: 0,
    caseArrivals: 0,
    procTimes: [],
    waitTimes: [],
  }));

  // Track case arrivals (when cases begin)
  for (const procCase of cases) {
    const d = new Date(procCase.caseStartTimestamp);
    const hour = d.getUTCHours();
    if (hour >= 0 && hour < 24) {
      hourlyData[hour].caseArrivals += 1;
    }
  }

  // Track event activity volumes
  for (const event of events) {
    const d = new Date(event.startTimestamp);
    const hour = d.getUTCHours();
    if (hour >= 0 && hour < 24) {
      hourlyData[hour].eventCount += 1;
      hourlyData[hour].procTimes.push(event.processingTimeMs);
      hourlyData[hour].waitTimes.push(event.waitingTimeMs);
    }
  }

  // Calculate average volume across active hours (or 24 hours)
  const activeHours = hourlyData.filter((b) => b.eventCount > 0);
  const avgHourlyVolume =
    activeHours.length > 0
      ? events.length / activeHours.length
      : events.length / 24;

  const peakThreshold = avgHourlyVolume * thresholdRatio;
  const peakHours: string[] = [];

  const hourlyBuckets: TimeBucketMetrics[] = hourlyData.map((b) => {
    const isPeak = b.eventCount > 0 && b.eventCount >= peakThreshold;
    if (isPeak) {
      peakHours.push(b.hourLabel);
    }

    const avgProcessing = calculateMean(b.procTimes);
    const avgWaiting = calculateMean(b.waitTimes);
    const volumeRatioToAvg =
      avgHourlyVolume > 0
        ? Math.round((b.eventCount / avgHourlyVolume) * 100) / 100
        : 0;

    return {
      hour: b.hour,
      hourLabel: b.hourLabel,
      eventVolume: b.eventCount,
      caseArrivals: b.caseArrivals,
      avgWaitingTimeMs: avgWaiting,
      avgProcessingTimeMs: avgProcessing,
      volumeRatioToAvg,
      isPeak,
      formattedAvgWaiting: formatDurationMs(avgWaiting),
      formattedAvgProcessing: formatDurationMs(avgProcessing),
    };
  });

  // Identify dominant arrival window
  let maxArrivalHour = 0;
  let maxArrivalCount = 0;
  for (const b of hourlyBuckets) {
    if (b.caseArrivals > maxArrivalCount) {
      maxArrivalCount = b.caseArrivals;
      maxArrivalHour = b.hour;
    }
  }

  const dominantArrivalWindow = `${maxArrivalHour.toString().padStart(2, "0")}:00 - ${(
    (maxArrivalHour + 2) % 24
  )
    .toString()
    .padStart(2, "0")}:00`;

  // Deterministic summary text
  let summaryText = "Event traffic is evenly distributed across operational hours.";
  if (peakHours.length > 0) {
    summaryText = `Peak activity is associated with ${peakHours.length} time window(s): ${peakHours.join(
      ", "
    )}. Dominant case intake occurs during ${dominantArrivalWindow}.`;
  }

  return {
    hourlyBuckets,
    peakHours,
    peakThresholdRatio: thresholdRatio,
    dominantArrivalWindow,
    summaryText,
  };
}
