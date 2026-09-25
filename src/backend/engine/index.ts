/**
 * FlowLens AI - Central Process Analysis Service
 * Phase 1: Event Data Engine
 *
 * Deterministic process mining pipeline:
 * Input (CSV or Events) -> Parsing -> Validation -> Case Reconstruction
 * -> Metrics Aggregation -> Bottleneck Contribution Scoring -> Bottleneck DNA.
 */

import {
  NormalizedEvent,
  ProcessAnalysisResult,
  DatasetSummary,
  ValidationError,
  ColumnMappingConfig,
  ProcessDomainInfo,
  ProcessDomain,
} from "@/shared/types";
import { parseCsvText } from "./csv-parser";
import { validateAndNormalizeRows } from "./validator";
import { reconstructProcessCases } from "./case-reconstruction";
import { aggregateStageAndProcessMetrics } from "./stage-analytics";
import { calculateBottleneckCandidates } from "./bottleneck-model";
import { calculateResourceMetrics } from "./resource-analytics";
import { calculateStageTransitions } from "./transitions";
import { calculatePeakAnalytics } from "./peak-analytics";
import { buildBottleneckEvidencePayload } from "./root-cause";
import { detectProcessDomain, DOMAIN_TERMINOLOGY } from "./schema-profiler";

export interface ProcessAnalysisOptions {
  datasetName?: string;
  processingWeight?: number;
  waitingWeight?: number;
  columnMapping?: ColumnMappingConfig;
  domainOverride?: ProcessDomain | string;
}

/**
 * Deterministically analyzes process events or raw CSV text.
 * Completely decoupled from React and browser environments. Usable in API routes,
 * worker scripts, backend services, and automated test runners.
 */
export function analyzeProcess(
  input: string | NormalizedEvent[],
  options?: ProcessAnalysisOptions
): ProcessAnalysisResult {
  let validEvents: NormalizedEvent[] = [];
  const validationErrors: ValidationError[] = [];
  let totalRowsParsed = 0;
  let detectedHeaders: string[] = [];
  let sampleRecords: Record<string, string>[] = [];

  if (typeof input === "string") {
    // Parse CSV with optional custom column mapping
    const parsedCsv = parseCsvText(input, options?.columnMapping);
    totalRowsParsed = parsedCsv.rows.length;
    detectedHeaders = parsedCsv.headers;
    sampleRecords = parsedCsv.rows.slice(0, 10).map((r) => r.record);
    validationErrors.push(...parsedCsv.validationErrors);

    // Validate rows
    if (parsedCsv.rows.length > 0) {
      const validationOutput = validateAndNormalizeRows(parsedCsv.rows);
      validEvents = validationOutput.validEvents;
      validationErrors.push(...validationOutput.validationErrors);
    }
  } else {
    // Array of already normalized events
    validEvents = input;
    totalRowsParsed = input.length;
    detectedHeaders = ["caseId", "activity", "startTime", "endTime", "resourceId"];
  }

  // Detect or apply domain classification
  let domainInfo: ProcessDomainInfo;
  if (options?.domainOverride && options.domainOverride in DOMAIN_TERMINOLOGY) {
    const d = options.domainOverride as ProcessDomain;
    domainInfo = {
      domain: d,
      confidence: 100,
      matchedKeywords: ["User Specified"],
      description: `Domain explicitly specified by user as ${d}.`,
      terminology: DOMAIN_TERMINOLOGY[d],
    };
  } else {
    domainInfo = detectProcessDomain(detectedHeaders, sampleRecords);
  }

  // Handle empty or unparseable dataset
  if (validEvents.length === 0) {
    const emptySummary: DatasetSummary = {
      name: options?.datasetName || "Untitled Dataset",
      totalRowsParsed,
      validEventsCount: 0,
      invalidRowsCount: validationErrors.length,
      uniqueCasesCount: 0,
      uniqueStagesCount: 0,
      uniqueResourcesCount: 0,
      timeRangeStart: "N/A",
      timeRangeEnd: "N/A",
    };

    return {
      datasetSummary: emptySummary,
      processMetrics: {
        totalCases: 0,
        totalEvents: 0,
        uniqueStagesCount: 0,
        avgCaseCycleTimeMs: 0,
        medianCaseCycleTimeMs: 0,
        minCaseCycleTimeMs: 0,
        maxCaseCycleTimeMs: 0,
        totalProcessProcessingTimeMs: 0,
        totalProcessWaitingTimeMs: 0,
        avgCaseProcessingTimeMs: 0,
        avgCaseWaitingTimeMs: 0,
        avgProcessEfficiencyPct: 0,
        formattedAvgCycleTime: "0ms",
        formattedAvgProcessingTime: "0ms",
        formattedAvgWaitingTime: "0ms",
        formattedTotalProcessingTime: "0ms",
        formattedTotalWaitingTime: "0ms",
      },
      stages: [],
      bottleneckCandidates: [],
      cases: [],
      resources: [],
      transitions: [],
      peakAnalysis: {
        hourlyBuckets: [],
        peakHours: [],
        peakThresholdRatio: 1.2,
        dominantArrivalWindow: "N/A",
        summaryText: "No data available.",
      },
      rootCauses: {},
      explanationPayloads: [],
      dataQualityIssues: [],
      validationErrors,
    };
  }

  // 1. Reconstruct Process Cases
  const { cases, dataQualityIssues } = reconstructProcessCases(validEvents);

  // 2. Aggregate Stage & Process Metrics
  const { stages, processMetrics } = aggregateStageAndProcessMetrics(validEvents, cases);

  // 3. Stage Transitions (Upstream/Downstream Queue Analysis)
  const transitions = calculateStageTransitions(cases);

  // 4. Peak-Time & Arrival Pattern Analysis
  const peakAnalysis = calculatePeakAnalytics(validEvents, cases);

  // 5. Resource Workload & Overload Analytics
  const resources = calculateResourceMetrics(validEvents, processMetrics.totalProcessProcessingTimeMs);

  // 6. Calculate Bottleneck Contributions & Bottleneck DNA (Phase 2)
  const bottleneckCandidates = calculateBottleneckCandidates(stages, processMetrics, {
    processingWeight: options?.processingWeight,
    waitingWeight: options?.waitingWeight,
    resourceMetrics: resources,
    peakAnalysis,
    events: validEvents,
  });

  // 7. Deterministic Root Cause Attribution & Explanation Payloads
  const rootCauses: Record<string, import("@/shared/types").RootCauseAttribution> = {};
  const explanationPayloads = bottleneckCandidates.map((candidate) => {
    const payload = buildBottleneckEvidencePayload(
      candidate,
      stages,
      resources,
      transitions,
      peakAnalysis,
      validEvents
    );
    rootCauses[candidate.stageName] = payload.rootCause;
    return payload;
  });

  // 8. Build Dataset Summary
  const startTimestamps = validEvents.map((e) => e.startTimestamp);
  const endTimestamps = validEvents.map((e) => e.endTimestamp);

  const minStartIso = new Date(Math.min(...startTimestamps)).toISOString();
  const maxEndIso = new Date(Math.max(...endTimestamps)).toISOString();

  const datasetSummary: DatasetSummary = {
    name: options?.datasetName || "Untitled Dataset",
    totalRowsParsed,
    validEventsCount: validEvents.length,
    invalidRowsCount: validationErrors.length,
    uniqueCasesCount: cases.length,
    uniqueStagesCount: stages.length,
    uniqueResourcesCount: resources.length,
    timeRangeStart: minStartIso,
    timeRangeEnd: maxEndIso,
    domain: domainInfo.domain,
  };

  return {
    datasetSummary,
    processMetrics,
    stages,
    bottleneckCandidates,
    cases,
    resources,
    transitions,
    peakAnalysis,
    rootCauses,
    explanationPayloads,
    dataQualityIssues,
    validationErrors,
    domainInfo,
    columnMapping: options?.columnMapping,
  };
}

export * from "./constants";
export * from "./time-utils";
export * from "./csv-parser";
export * from "./validator";
export * from "./case-reconstruction";
export * from "./stage-analytics";
export * from "./bottleneck-model";
export * from "./resource-analytics";
export * from "./transitions";
export * from "./peak-analytics";
export * from "./root-cause";
export * from "./schema-profiler";

