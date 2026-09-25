/**
 * FlowLens AI - Canonical Process Mining Data Types
 * Shared Layer (Browser & Server safe)
 */

import type { ProcessDomainInfo, ColumnMappingConfig } from "./schema";

export type EventStatus = "completed" | "active" | "cancelled" | "failed" | string;

/**
 * Raw input record extracted from CSV or payload
 */
export interface EventRecord {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Normalized canonical event representation
 */
export interface NormalizedEvent {
  caseId: string;
  activity: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  startTimestamp: number; // Unix timestamp in ms
  endTimestamp: number;   // Unix timestamp in ms
  processingTimeMs: number;
  waitingTimeMs: number; // Waiting time before this event within its case (0 for first event)
  resourceId?: string;
  status?: EventStatus;
  location?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
  rowIndex: number; // 1-based original CSV row index for traceability
}

/**
 * Validation error details for ingestion errors
 */
export interface ValidationError {
  rowIndex?: number;
  column?: string;
  value?: string;
  code:
    | "MISSING_REQUIRED_COLUMN"
    | "MISSING_CASE_ID"
    | "MISSING_ACTIVITY"
    | "INVALID_TIMESTAMP"
    | "END_BEFORE_START"
    | "EMPTY_DATASET"
    | "DUPLICATE_EVENT"
    | "UNRECOGNIZED_FORMAT"
    | "CORRUPT_ROW";
  message: string;
}

/**
 * Data quality anomalies that do not invalidate the entire dataset
 */
export interface DataQualityIssue {
  caseId: string;
  activity: string;
  rowIndex: number;
  type: "NEGATIVE_WAITING_TIME" | "OVERLAPPING_EVENTS" | "ZERO_DURATION" | "ANOMALOUS_DURATION";
  message: string;
  severity: "info" | "warning" | "critical";
  overlapMs?: number;
}

/**
 * Chronologically reconstructed process case
 */
export interface ProcessCase {
  caseId: string;
  events: NormalizedEvent[];
  eventCount: number;
  caseStart: string;
  caseEnd: string;
  caseStartTimestamp: number;
  caseEndTimestamp: number;
  cycleTimeMs: number;
  totalProcessingTimeMs: number;
  totalWaitingTimeMs: number;
  firstStage: string;
  finalStage: string;
  stageSequence: string[];
}

/**
 * Aggregated statistics for a specific process stage (activity)
 */
export interface StageMetrics {
  stageName: string;
  eventCount: number;
  uniqueCaseCount: number;
  
  // Processing time metrics (ms)
  totalProcessingTimeMs: number;
  avgProcessingTimeMs: number;
  medianProcessingTimeMs: number;
  minProcessingTimeMs: number;
  maxProcessingTimeMs: number;
  processingTimeVariance: number;
  processingTimeStdDev: number;

  // Waiting time metrics before stage (ms)
  totalWaitingTimeMs: number;
  avgWaitingTimeMs: number;
  medianWaitingTimeMs: number;
  minWaitingTimeMs: number;
  maxWaitingTimeMs: number;

  // Process impact percentages
  processingContributionPct: number; // Share of total process processing time (0 - 100)
  waitingContributionPct: number;    // Share of total process waiting time (0 - 100)
  cycleContributionPct: number;      // Share of total process lead time (0 - 100)

  // Human-readable formatted strings
  formattedAvgProcessingTime: string;
  formattedAvgWaitingTime: string;
  formattedTotalProcessingTime: string;
  formattedTotalWaitingTime: string;
}

/**
 * Bottleneck DNA Signals (Phase 2 deterministic intelligence)
 * Signals: WAITING, PROCESSING, VARIABILITY, VOLUME, RESOURCE, PEAK
 */
export interface BottleneckDNA {
  waitingHeavy: boolean;    // Bottleneck caused predominantly by delay before activity
  processingHeavy: boolean; // Bottleneck caused by lengthy execution
  highVariance: boolean;    // Erratic, unpredictable execution duration
  highVolume: boolean;      // Disproportionately high event concentration
  resourceHeavy: boolean;   // Concentration of work or delay on overloaded resource(s)
  peakConcentrated: boolean;// High concentration during specific peak time windows
  primaryFactor: "WAITING" | "PROCESSING" | "VARIABILITY" | "VOLUME" | "RESOURCE" | "PEAK";
  confidenceScore: number;  // Deterministic signal clarity indicator (0.0 to 1.0)
  tags: string[];
}

/**
 * Ranked candidate bottleneck
 */
export interface BottleneckCandidate {
  rank: number;
  stageName: string;
  delayContributionScore: number; // Composite weighted bottleneck score (0 - 100)
  processingScore: number;        // Processing contribution component
  waitingScore: number;           // Waiting contribution component
  dna: BottleneckDNA;
  stageMetrics: StageMetrics;
  rationale: string;
}

/**
 * Operational resource statistics with workload and overload detection
 */
export interface ResourceMetrics {
  resourceId: string;
  eventsHandled: number;
  uniqueCases: number;
  totalProcessingTimeMs: number;
  avgProcessingTimeMs: number;
  medianProcessingTimeMs: number;
  stagesHandled: string[];
  workloadSharePct: number;       // % share of total process processing time
  eventSharePct: number;          // % share of total events
  workloadRatioToAvg: number;     // Ratio of this resource's workload vs average resource
  associatedWaitingTimeMs: number;// Queue delay associated with stages worked by this resource
  isOverloaded: boolean;          // Transparent overload signal
  overloadReasons: string[];      // Explanations using "associated with" terminology
  formattedAvgProcessingTime: string;
  formattedTotalProcessingTime: string;
}

/**
 * Time bucket metrics for hourly / temporal pattern analysis
 */
export interface TimeBucketMetrics {
  hour: number;             // 0 - 23
  hourLabel: string;        // e.g. "08:00 - 09:00"
  eventVolume: number;
  caseArrivals: number;     // Number of cases that began in this hour
  avgWaitingTimeMs: number;
  avgProcessingTimeMs: number;
  volumeRatioToAvg: number; // Volume relative to average hourly volume
  isPeak: boolean;          // Deterministically flagged when volume >= peak threshold
  formattedAvgWaiting: string;
  formattedAvgProcessing: string;
}

/**
 * Peak-time analysis summary
 */
export interface PeakAnalysisResult {
  hourlyBuckets: TimeBucketMetrics[];
  peakHours: string[];             // Labels of detected peak hours
  peakThresholdRatio: number;      // e.g. 1.20 (120% of average)
  dominantArrivalWindow: string;   // e.g. "08:00 - 10:00"
  summaryText: string;             // Metric-grounded temporal pattern text
}

/**
 * Stage-to-stage transition metrics for upstream/downstream queue analysis
 */
export interface StageTransition {
  fromStage: string;
  toStage: string;
  transitionCount: number;
  avgWaitTimeMs: number;
  medianWaitTimeMs: number;
  minWaitTimeMs: number;
  maxWaitTimeMs: number;
  totalWaitTimeMs: number;
  formattedAvgWaitTime: string;
  formattedTotalWaitTime: string;
}

/**
 * Deterministic root-cause attribution layer
 */
export interface RootCauseAttribution {
  stage: string;
  primaryCause: "WAITING" | "PROCESSING" | "VARIABILITY" | "VOLUME" | "RESOURCE" | "PEAK";
  supportingSignals: string[];
  evidence: {
    waitingContributionPct: number;
    processingContributionPct: number;
    cycleContributionPct: number;
    dominantPeakHour?: string;
    associatedResources?: string[];
    resourceWorkloadSharePct?: number;
    upstreamStage?: string;
    downstreamStage?: string;
    upstreamAvgWaitMs?: number;
  };
  interpretation: string; // Metric-grounded deterministic explanation
}

/**
 * Deterministic explanation payload structured for future LLM (Gemini) consumption
 */
export interface BottleneckEvidence {
  stage: string;
  rank: number;
  score: number;
  why: {
    primary: "WAITING" | "PROCESSING" | "VARIABILITY" | "VOLUME" | "RESOURCE" | "PEAK";
    processingContribution: number;
    waitingContribution: number;
  };
  dna: BottleneckDNA;
  rootCause: RootCauseAttribution;
  signalCoverage: string; // e.g. "Complete (6/6 signals analyzed)"
  resourceEvidence: Array<{
    resourceId: string;
    eventsHandled: number;
    workloadSharePct: number;
    note: string;
  }>;
  peakEvidence: Array<{
    period: string;
    volumeSharePct: number;
    note: string;
  }>;
  upstreamEvidence: Array<{
    fromStage: string;
    transitionCount: number;
    avgWaitMs: number;
    formattedAvgWait: string;
  }>;
  downstreamEvidence: Array<{
    toStage: string;
    transitionCount: number;
    avgWaitMs: number;
    formattedAvgWait: string;
  }>;
}

/**
 * Macro process-wide metrics
 */
export interface ProcessMetrics {
  totalCases: number;
  totalEvents: number;
  uniqueStagesCount: number;
  avgCaseCycleTimeMs: number;
  medianCaseCycleTimeMs: number;
  minCaseCycleTimeMs: number;
  maxCaseCycleTimeMs: number;
  totalProcessProcessingTimeMs: number; // Aggregate processing effort across all events/cases
  totalProcessWaitingTimeMs: number;    // Aggregate queue waiting effort across all events/cases
  avgCaseProcessingTimeMs: number;      // Average active processing duration per case
  avgCaseWaitingTimeMs: number;         // Average idle queue waiting duration per case
  avgProcessEfficiencyPct: number;      // Total Processing Time / Total Lead Time * 100
  formattedAvgCycleTime: string;        // e.g. "6h"
  formattedAvgProcessingTime: string;   // e.g. "1h 40m"
  formattedAvgWaitingTime: string;      // e.g. "4h 20m"
  formattedTotalProcessingTime: string; // e.g. "16h 40m" (Aggregate across cases)
  formattedTotalWaitingTime: string;    // e.g. "1d 19h" (Aggregate across cases)
}

/**
 * Dataset overview summary
 */
export interface DatasetSummary {
  name: string;
  totalRowsParsed: number;
  validEventsCount: number;
  invalidRowsCount: number;
  uniqueCasesCount: number;
  uniqueStagesCount: number;
  uniqueResourcesCount: number;
  timeRangeStart: string;
  timeRangeEnd: string;
  domain?: string;
}

/**
 * Comprehensive analysis output produced by the deterministic engine
 */
export interface ProcessAnalysisResult {
  datasetSummary: DatasetSummary;
  processMetrics: ProcessMetrics;
  stages: StageMetrics[];
  bottleneckCandidates: BottleneckCandidate[];
  cases: ProcessCase[];
  resources: ResourceMetrics[];
  transitions: StageTransition[];
  peakAnalysis: PeakAnalysisResult;
  rootCauses: Record<string, RootCauseAttribution>;
  explanationPayloads: BottleneckEvidence[];
  dataQualityIssues: DataQualityIssue[];
  validationErrors: ValidationError[];
  domainInfo?: ProcessDomainInfo;
  columnMapping?: ColumnMappingConfig;
}
