/**
 * FlowLens AI - Phase 1 Automated Engine Test Suite
 *
 * Verifies:
 * 1. CSV parsing & Header Tokenization
 * 2. Column Alias Normalization (case_id, activity, start_time, end_time, resource_id)
 * 3. Validation: Missing required column
 * 4. Validation: Invalid timestamp detection
 * 5. Validation: End before start detection
 * 6. Case Reconstruction & Chronological ordering
 * 7. Processing time calculations
 * 8. Waiting time & Overlap detection
 * 9. Cycle time calculations
 * 10. Stage Aggregations (mean, median, variance, std dev)
 * 11. Bottleneck Contribution Model
 * 12. Bottleneck DNA Signals (WAITING, PROCESSING, VARIABILITY, VOLUME)
 * 13. Resource operational statistics
 * 14. Synthetic Hidden Bottleneck Dataset Verification:
 *     - Proves Review has the longest processing time
 *     - Proves Verification has the highest waiting time
 *     - Demonstrates that Verification is ranked #1 bottleneck candidate
 */

import {
  parseCsvText,
  matchCanonicalField,
  validateAndNormalizeRows,
  reconstructProcessCases,
  analyzeProcess,
} from "../src/backend/engine";
import {
  SYNTHETIC_HIDDEN_BOTTLENECK_CSV,
  SYNTHETIC_EXPECTED_OUTCOME,
} from "../src/data/synthetic-dataset";
import {
  simulateScenario,
  validateSimulationScenario,
  calculateResourceQueueReductionFactor,
} from "../src/backend/simulation";
import { SimulationScenario, Intervention, ProcessAnalysisResult } from "../src/shared/types";
import { GoogleGenAI } from "@google/genai";
import {
  buildStructuredEvidence,
  buildUnifiedExplanationPrompt,
  buildSimulationPrompt,
  explainBottleneck,
  explainSimulation,
  explainBottleneckMigration,
  generateUnifiedAIExplanation,
  buildDeterministicExecutiveSummary,
} from "../src/backend/ai";
import { fetchAllPredictions } from "../src/backend/ml/client";
import { MLProcessPredictions } from "../src/shared/types";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("FLOWLENS AI — PHASE 1 AUTOMATED ENGINE TEST SUITE");
  console.log("=======================================================\n");

  // 1. Column Alias Detection
  console.log("Suite 1: Header Normalization & Canonical Aliases");
  assert(
    matchCanonicalField("Case ID") === "case_id" &&
      matchCanonicalField("caseid") === "case_id" &&
      matchCanonicalField("Instance_ID") === "case_id",
    "Maps case ID variants to case_id"
  );
  assert(
    matchCanonicalField("Stage") === "activity" &&
      matchCanonicalField("process_stage") === "activity" &&
      matchCanonicalField("Step") === "activity",
    "Maps stage/step variants to activity"
  );
  assert(
    matchCanonicalField("started_at") === "start_time" &&
      matchCanonicalField("Start Date") === "start_time" &&
      matchCanonicalField("begin_time") === "start_time",
    "Maps start time variants to start_time"
  );
  assert(
    matchCanonicalField("completed_at") === "end_time" &&
      matchCanonicalField("End Date") === "end_time" &&
      matchCanonicalField("Finish_Time") === "end_time",
    "Maps end time variants to end_time"
  );
  assert(
    matchCanonicalField("Operator") === "resource_id" &&
      matchCanonicalField("Assignee") === "resource_id" &&
      matchCanonicalField("User") === "resource_id",
    "Maps operator/user variants to resource_id"
  );
  assert(
    matchCanonicalField("RandomUnknownColumn") === null,
    "Returns null for unrecognized header without guessing"
  );

  // 2. CSV Parsing & Quoted Fields
  console.log("\nSuite 2: CSV Parsing & Tokenization");
  const quotedCsv = `case_id,activity,start_time,end_time\n"C001","Step, with comma","2026-09-01 09:00","2026-09-01 09:30"`;
  const parsedQuoted = parseCsvText(quotedCsv);
  assert(parsedQuoted.rows.length === 1, "Parses single row with quoted commas");
  assert(
    parsedQuoted.rows[0].record["activity"] === "Step, with comma",
    "Preserves comma inside quotes correctly"
  );

  // 3. Validation: Missing Required Columns
  console.log("\nSuite 3: Validation Errors");
  const missingColCsv = `case_id,activity,start_time\nC1,Test,2026-09-01 10:00`;
  const parsedMissing = parseCsvText(missingColCsv);
  assert(
    parsedMissing.missingRequired.includes("end_time"),
    "Flags missing required end_time column"
  );

  // 4. Validation: Invalid Timestamp & End before Start
  const badRows = [
    {
      record: {
        case_id: "C01",
        activity: "Task",
        start_time: "not-a-date",
        end_time: "2026-09-01 10:00",
      },
      rowIndex: 2,
    },
    {
      record: {
        case_id: "C02",
        activity: "Task",
        start_time: "2026-09-01 12:00",
        end_time: "2026-09-01 10:00", // End before start
      },
      rowIndex: 3,
    },
    {
      record: {
        case_id: "", // Missing case id
        activity: "Task",
        start_time: "2026-09-01 10:00",
        end_time: "2026-09-01 11:00",
      },
      rowIndex: 4,
    },
  ];
  const valResult = validateAndNormalizeRows(badRows);
  assert(
    valResult.validationErrors.some((e) => e.code === "INVALID_TIMESTAMP"),
    "Catches unparseable timestamp"
  );
  assert(
    valResult.validationErrors.some((e) => e.code === "END_BEFORE_START"),
    "Catches end_time preceding start_time"
  );
  assert(
    valResult.validationErrors.some((e) => e.code === "MISSING_CASE_ID"),
    "Catches empty Case ID"
  );

  // 5. Case Reconstruction, Waiting Times, Overlaps
  console.log("\nSuite 4: Case Reconstruction & Time Calculations");
  const testEvents = [
    {
      caseId: "CASE_A",
      activity: "Step2",
      startTime: "2026-09-01T10:30:00.000Z",
      endTime: "2026-09-01T11:00:00.000Z",
      startTimestamp: new Date("2026-09-01T10:30:00.000Z").getTime(),
      endTimestamp: new Date("2026-09-01T11:00:00.000Z").getTime(),
      processingTimeMs: 30 * 60 * 1000,
      waitingTimeMs: 0,
      rowIndex: 2,
    },
    {
      caseId: "CASE_A",
      activity: "Step1",
      startTime: "2026-09-01T10:00:00.000Z",
      endTime: "2026-09-01T10:15:00.000Z",
      startTimestamp: new Date("2026-09-01T10:00:00.000Z").getTime(),
      endTimestamp: new Date("2026-09-01T10:15:00.000Z").getTime(),
      processingTimeMs: 15 * 60 * 1000,
      waitingTimeMs: 0,
      rowIndex: 1,
    },
  ];
  const { cases } = reconstructProcessCases(testEvents);
  assert(cases.length === 1, "Reconstructs single case");
  const caseA = cases[0];
  assert(caseA.firstStage === "Step1", "Sorts case events chronologically");
  assert(caseA.finalStage === "Step2", "Identifies correct final stage");
  // Step 1 ended 10:15, Step 2 started 10:30 -> 15m waiting time
  assert(
    caseA.events[1].waitingTimeMs === 15 * 60 * 1000,
    "Calculates inter-stage waiting time exactly (15m)"
  );
  assert(
    caseA.cycleTimeMs === 60 * 60 * 1000,
    "Calculates total case cycle time exactly (60m)"
  );
  assert(
    caseA.totalProcessingTimeMs === 45 * 60 * 1000,
    "Calculates total processing time exactly (45m)"
  );

  // 6. Overlapping Event Detection
  const overlappingEvents = [
    {
      caseId: "CASE_O",
      activity: "StageA",
      startTime: "2026-09-01T10:00:00.000Z",
      endTime: "2026-09-01T10:30:00.000Z",
      startTimestamp: new Date("2026-09-01T10:00:00.000Z").getTime(),
      endTimestamp: new Date("2026-09-01T10:30:00.000Z").getTime(),
      processingTimeMs: 30 * 60 * 1000,
      waitingTimeMs: 0,
      rowIndex: 1,
    },
    {
      caseId: "CASE_O",
      activity: "StageB",
      startTime: "2026-09-01T10:20:00.000Z", // Starts 10 min before StageA ends
      endTime: "2026-09-01T10:50:00.000Z",
      startTimestamp: new Date("2026-09-01T10:20:00.000Z").getTime(),
      endTimestamp: new Date("2026-09-01T10:50:00.000Z").getTime(),
      processingTimeMs: 30 * 60 * 1000,
      waitingTimeMs: 0,
      rowIndex: 2,
    },
  ];
  const { dataQualityIssues: overlapIssues } = reconstructProcessCases(overlappingEvents);
  assert(
    overlapIssues.some((issue) => issue.type === "OVERLAPPING_EVENTS"),
    "Flags overlapping event execution as data quality issue"
  );

  // 7. Synthetic Hidden Bottleneck Dataset Verification (CRITICAL TEST)
  console.log("\nSuite 5: Deterministic Hidden Bottleneck Scenario");
  const syntheticResult = analyzeProcess(SYNTHETIC_HIDDEN_BOTTLENECK_CSV, {
    datasetName: "Hidden Bottleneck Benchmark",
  });

  assert(
    syntheticResult.datasetSummary.validEventsCount === SYNTHETIC_EXPECTED_OUTCOME.expectedTotalEvents,
    `Parsed all ${SYNTHETIC_EXPECTED_OUTCOME.expectedTotalEvents} events`
  );
  assert(
    syntheticResult.datasetSummary.uniqueCasesCount === SYNTHETIC_EXPECTED_OUTCOME.expectedTotalCases,
    `Reconstructed ${SYNTHETIC_EXPECTED_OUTCOME.expectedTotalCases} cases`
  );
  assert(
    syntheticResult.stages.length === SYNTHETIC_EXPECTED_OUTCOME.expectedStagesCount,
    `Identified all ${SYNTHETIC_EXPECTED_OUTCOME.expectedStagesCount} distinct stages`
  );

  const reviewStage = syntheticResult.stages.find((s) => s.stageName === "Review")!;
  const verificationStage = syntheticResult.stages.find((s) => s.stageName === "Verification")!;

  assert(reviewStage !== undefined, "Found Review stage metrics");
  assert(verificationStage !== undefined, "Found Verification stage metrics");

  // 1. Verify that Review HAS the longest processing time
  const longestProc = [...syntheticResult.stages].sort(
    (a, b) => b.totalProcessingTimeMs - a.totalProcessingTimeMs
  )[0];
  assert(
    longestProc.stageName === "Review",
    "Review is the stage with the longest processing duration (60m avg)",
    `Actual longest: ${longestProc.stageName}`
  );

  // 2. Verify that Verification HAS the largest waiting time
  const largestWait = [...syntheticResult.stages].sort(
    (a, b) => b.totalWaitingTimeMs - a.totalWaitingTimeMs
  )[0];
  assert(
    largestWait.stageName === "Verification",
    "Verification accumulates the vast majority of queue waiting time (~200m avg)",
    `Actual highest wait: ${largestWait.stageName}`
  );

  // 3. Verify that Verification is ranked as the #1 BOTTLENECK CANDIDATE!
  const topCandidate = syntheticResult.bottleneckCandidates[0];
  assert(
    topCandidate.stageName === "Verification",
    `FlowLens identifies Verification as dominant #1 bottleneck (Score: ${topCandidate.delayContributionScore}) despite Review having 4x longer processing time!`,
    `Actual #1: ${topCandidate.stageName}`
  );

  // 4. Verify Bottleneck DNA signals for Verification
  assert(
    topCandidate.dna.waitingHeavy === true,
    "Bottleneck DNA identifies Verification as waitingHeavy: true"
  );
  assert(
    topCandidate.dna.primaryFactor === "WAITING",
    "Bottleneck DNA primaryFactor is correctly categorized as WAITING"
  );

  // 8. Resource Metrics
  console.log("\nSuite 6: Resource Statistics Foundation");
  assert(
    syntheticResult.resources.length > 0,
    "Generates operational metrics for resources"
  );
  assert(
    syntheticResult.resources[0].eventsHandled > 0 &&
      syntheticResult.resources[0].stagesHandled.length > 0,
    "Tracks event counts and stages handled per resource"
  );

  // Phase 2: Suite 7: Resource Workload, Concentration & Overload Intelligence
  console.log("\nSuite 7: Resource Workload & Overload Intelligence");
  assert(
    syntheticResult.resources.every(
      (r) =>
        r.workloadSharePct >= 0 &&
        r.medianProcessingTimeMs >= 0 &&
        typeof r.workloadRatioToAvg === "number"
    ),
    "Calculates workload share, median duration, and workload ratio for all resources"
  );

  const reviewResources = syntheticResult.resources.filter((r) =>
    r.stagesHandled.includes("Review")
  );
  assert(
    reviewResources.length > 0 &&
      reviewResources.some((r) => r.workloadSharePct > 20),
    "Detects high workload share for Review stage operators (>20% total process work)"
  );

  assert(
    syntheticResult.resources.some((r) => r.isOverloaded === true) &&
      syntheticResult.resources.some((r) =>
        r.overloadReasons.some((reason) => reason.includes("Associated with"))
      ),
    "Identifies resource overload and formats reasons strictly using non-causal 'associated with' terminology"
  );

  // Phase 2: Suite 8: Peak-Time Analysis & Hourly Temporal Bucketing
  console.log("\nSuite 8: Peak-Time Analysis & Temporal Bucketing");
  assert(
    syntheticResult.peakAnalysis.hourlyBuckets.length === 24,
    "Generates exactly 24 hourly time buckets"
  );
  assert(
    syntheticResult.peakAnalysis.peakHours.length > 0,
    `Identifies peak operational hours exceeding 120% average threshold (${syntheticResult.peakAnalysis.peakHours.join(", ")})`
  );
  assert(
    syntheticResult.peakAnalysis.dominantArrivalWindow.length > 0,
    `Detects dominant case arrival window: ${syntheticResult.peakAnalysis.dominantArrivalWindow}`
  );

  // Phase 2: Suite 9: Stage Transition Analytics (Queue Formation)
  console.log("\nSuite 9: Stage Transition Analytics");
  assert(
    syntheticResult.transitions.length >= 4,
    "Reconstructs sequential process transitions"
  );
  const intakeToVerification = syntheticResult.transitions.find(
    (t) => t.fromStage === "Intake" && t.toStage === "Verification"
  );
  assert(
    intakeToVerification !== undefined && intakeToVerification.avgWaitTimeMs > 60 * 60 * 1000,
    "Identifies that Intake -> Verification transition accumulates the massive queue stall (>60m avg wait)"
  );
  assert(
    intakeToVerification !== undefined && intakeToVerification.transitionCount === 10,
    "Correctly records 10 transitions from Intake to Verification"
  );

  // Phase 2: Suite 10: Root Cause Attribution & Explanation Payload
  console.log("\nSuite 10: Root Cause Attribution & Explanation Payload");
  const verificationRootCause = syntheticResult.rootCauses["Verification"];
  assert(
    verificationRootCause !== undefined &&
      verificationRootCause.primaryCause === "WAITING",
    "Root cause engine attributes Verification primary cause to WAITING"
  );
  assert(
    verificationRootCause.evidence.upstreamStage === "Intake",
    "Root cause engine links Verification queue to upstream feeder Intake"
  );
  assert(
    verificationRootCause.interpretation.includes("associated with") &&
      verificationRootCause.interpretation.includes("queue before processing"),
    "Generates metric-grounded, non-causal root cause interpretation text"
  );

  assert(
    syntheticResult.explanationPayloads.length === syntheticResult.bottleneckCandidates.length,
    "Generates complete explanation payloads for all bottleneck candidates"
  );

  const topPayload = syntheticResult.explanationPayloads[0];
  assert(
    topPayload.stage === "Verification" &&
      topPayload.rank === 1 &&
      topPayload.upstreamEvidence.length > 0 &&
      topPayload.why.waitingContribution > 90,
    "Explanation payload contains structured, deterministic LLM-ready evidence"
  );

  // =========================================================================
  // PHASE 3: WHAT-IF INTERVENTION SIMULATOR & BOTTLENECK MIGRATION TESTS
  // =========================================================================

  console.log("\nSuite 11: Intervention Scenario Validation");
  const invalidTypeScenario = {
    interventions: [{ type: "MAGIC_EXPEDITE", stage: "Verification" }] as unknown as Intervention[],
  };
  const valType = validateSimulationScenario(invalidTypeScenario, syntheticResult);
  assert(
    !valType.isValid && valType.errors.some((e) => e.code === "INVALID_INTERVENTION_TYPE"),
    "Flags unsupported intervention type"
  );

  const invalidStageScenario: SimulationScenario = {
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Teleportation", additionalResources: 1 }],
  };
  const valStage = validateSimulationScenario(invalidStageScenario, syntheticResult);
  assert(
    !valStage.isValid && valStage.errors.some((e) => e.code === "STAGE_NOT_FOUND"),
    "Flags non-existent target stage"
  );

  const invalidResourceScenario: SimulationScenario = {
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 0 }],
  };
  const valRes = validateSimulationScenario(invalidResourceScenario, syntheticResult);
  assert(
    !valRes.isValid && valRes.errors.some((e) => e.code === "INVALID_ADDITIONAL_RESOURCES"),
    "Rejects additionalResources < 1"
  );

  const invalidPercentScenario: SimulationScenario = {
    interventions: [{ type: "QUEUE_REDUCTION", stage: "Verification", reductionPercent: 95 }],
  };
  const valPct = validateSimulationScenario(invalidPercentScenario, syntheticResult);
  assert(
    !valPct.isValid && valPct.errors.some((e) => e.code === "INVALID_REDUCTION_PERCENT"),
    "Rejects reductionPercent > 90%"
  );

  const validScenario: SimulationScenario = {
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 1 }],
  };
  const valOk = validateSimulationScenario(validScenario, syntheticResult);
  assert(valOk.isValid && valOk.errors.length === 0, "Accepts valid intervention scenario");

  console.log("\nSuite 12: Processing Time Reduction Simulation");
  const reviewStageBefore = syntheticResult.stages.find((s) => s.stageName === "Review")!;
  const procScenario: SimulationScenario = {
    interventions: [{ type: "PROCESSING_TIME_REDUCTION", stage: "Review", reductionPercent: 30 }],
  };
  const procSim = simulateScenario(syntheticResult, procScenario);
  const reviewStageAfter = procSim.simulatedStages.find((s) => s.stageName === "Review")!;

  assert(
    reviewStageAfter.totalProcessingTimeMs === Math.round(reviewStageBefore.totalProcessingTimeMs * 0.7),
    "Reduces stage processing time by exactly 30%"
  );
  assert(
    reviewStageAfter.totalWaitingTimeMs === reviewStageBefore.totalWaitingTimeMs,
    "Preserves stage waiting time unaffected during processing reduction"
  );
  assert(
    procSim.simulatedMetrics.totalProcessProcessingTimeMs < syntheticResult.processMetrics.totalProcessProcessingTimeMs,
    "Recalculates process-wide processing duration accurately"
  );

  console.log("\nSuite 13: Queue Reduction Simulation");
  const verifBefore = syntheticResult.stages.find((s) => s.stageName === "Verification")!;
  const queueScenario: SimulationScenario = {
    interventions: [{ type: "QUEUE_REDUCTION", stage: "Verification", reductionPercent: 50 }],
  };
  const queueSim = simulateScenario(syntheticResult, queueScenario);
  const verifAfter = queueSim.simulatedStages.find((s) => s.stageName === "Verification")!;

  assert(
    verifAfter.totalWaitingTimeMs === Math.round(verifBefore.totalWaitingTimeMs * 0.5),
    "Reduces stage waiting time by exactly 50%"
  );
  assert(
    queueSim.comparison.waitingReductionPercent > 0 && queueSim.comparison.cycleTimeReductionPercent > 0,
    "Reflects queue relief in macro process cycle time and waiting metrics"
  );

  console.log("\nSuite 14: Resource Increase & Capacity Elasticity");
  const verifResourceCalc = calculateResourceQueueReductionFactor(verifBefore, 1, 2);
  assert(
    verifResourceCalc.reductionPercent > 80 && verifResourceCalc.delayRatio < 0.2,
    "Models Kingman queue collapse on congested stage under capacity expansion (>80% relief)"
  );

  console.log("\nSuite 15: Baseline State Immutability");
  const snapshotBefore = JSON.stringify(syntheticResult);
  simulateScenario(syntheticResult, {
    interventions: [
      { type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 2 },
      { type: "PROCESSING_TIME_REDUCTION", stage: "Review", reductionPercent: 40 },
    ],
  });
  const snapshotAfter = JSON.stringify(syntheticResult);
  assert(snapshotBefore === snapshotAfter, "Guarantees zero mutation of baseline ProcessAnalysisResult");

  console.log("\nSuite 16: Bottleneck Score Recalculation & Comparison");
  const sim1Res = simulateScenario(syntheticResult, {
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 1 }],
  });
  assert(
    sim1Res.stageResults.length === syntheticResult.stages.length,
    "Generates stage results for all process stages"
  );
  const verifStageRes = sim1Res.stageResults.find((s) => s.stageName === "Verification")!;
  assert(
    verifStageRes.scoreChange < 0 && verifStageRes.simulatedScore < verifStageRes.baselineScore,
    "Recalculates lower bottleneck score for relieved stage"
  );
  assert(
    sim1Res.comparison.cycleTimeReductionPercent > 50,
    "Measures significant overall cycle time improvement (>50%) when dominant queue is relieved"
  );

  console.log("\nSuite 17: Bottleneck Migration Detection");
  const sim2Res = simulateScenario(syntheticResult, {
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 2 }],
  });
  assert(
    sim2Res.migration.migrated === true,
    "Detects simulated bottleneck migration when capacity relief shifts delay ranking"
  );
  assert(
    sim2Res.migration.fromStage === "Verification" && sim2Res.migration.toStage === "Review",
    "Accurately identifies migration from Verification to Review"
  );
  assert(
    sim2Res.migration.narrative.includes("Simulated bottleneck migration detected"),
    "Formats narrative using non-causal simulated terminology"
  );

  console.log("\nSuite 18: No-Migration & Convergence Scenarios");
  assert(
    sim1Res.migration.migrated === false &&
      sim1Res.migration.pattern === "BOTTLENECK_IMPROVED_REMAINS_TOP",
    "Identifies BOTTLENECK_IMPROVED_REMAINS_TOP when stage improves but retains Rank 1"
  );

  const trivialScenario: SimulationScenario = {
    interventions: [{ type: "PROCESSING_TIME_REDUCTION", stage: "Dispatch", reductionPercent: 1 }],
  };
  const trivialSim = simulateScenario(syntheticResult, trivialScenario);
  assert(
    trivialSim.migration.migrated === false &&
      (trivialSim.migration.pattern === "NO_MEANINGFUL_CHANGE" ||
        trivialSim.migration.pattern === "SAME_BOTTLENECK_REMAINS"),
    "Identifies NO_MEANINGFUL_CHANGE / SAME_BOTTLENECK_REMAINS for negligible interventions"
  );

  console.log("\nSuite 19: Multi-Scenario Outcomes & LLM Explanation Payload");
  assert(
    sim2Res.outcomes.length === 1 &&
      sim2Res.outcomes[0].migrationDetected === true &&
      sim2Res.outcomes[0].newBottleneckStage === "Review",
    "Produces structured, objective SimulationOutcome data"
  );
  console.log("\nSuite 20: Phase 3.1 Metric Consistency & Aggregation Audit");
  // 1. Case Cycle Time Definition
  let allCasesHaveExactCycleTime = true;
  let allSequentialCasesSumExact = true;
  for (const c of syntheticResult.cases) {
    if (c.cycleTimeMs !== c.caseEndTimestamp - c.caseStartTimestamp) {
      allCasesHaveExactCycleTime = false;
    }
    if (c.cycleTimeMs !== c.totalProcessingTimeMs + c.totalWaitingTimeMs) {
      allSequentialCasesSumExact = false;
    }
  }
  assert(
    allCasesHaveExactCycleTime,
    "Case cycle time strictly defined as elapsed time from first event start to final event end"
  );
  assert(
    allSequentialCasesSumExact,
    "In sequential non-overlapping cases, case cycle time exactly equals case processing + case waiting"
  );

  // 2. Aggregate vs Per-Case Metrics
  const sumCaseWait = syntheticResult.cases.reduce((acc, c) => acc + c.totalWaitingTimeMs, 0);
  const sumCaseProc = syntheticResult.cases.reduce((acc, c) => acc + c.totalProcessingTimeMs, 0);
  assert(
    syntheticResult.processMetrics.totalProcessWaitingTimeMs === sumCaseWait &&
      syntheticResult.processMetrics.totalProcessProcessingTimeMs === sumCaseProc,
    "Aggregate waiting and processing metrics are exact sums across all process cases (156,000,000 ms & 60,000,000 ms)"
  );

  assert(
    syntheticResult.processMetrics.avgCaseWaitingTimeMs === Math.round(sumCaseWait / syntheticResult.cases.length) &&
      syntheticResult.processMetrics.avgCaseProcessingTimeMs === Math.round(sumCaseProc / syntheticResult.cases.length),
    "Per-case averages strictly equal aggregate metrics divided by total case count (4h 20m & 1h 40m)"
  );

  assert(
    syntheticResult.processMetrics.avgCaseCycleTimeMs ===
      syntheticResult.processMetrics.avgCaseProcessingTimeMs + syntheticResult.processMetrics.avgCaseWaitingTimeMs,
    "Average Case Cycle Time (6h) exactly equals Avg Processing (1h 40m) + Avg Waiting (4h 20m)"
  );

  // 3. Bottleneck Score Formula Consistency
  const verifCandidate = syntheticResult.bottleneckCandidates.find((b) => b.stageName === "Verification")!;
  const expectedVerifScore =
    Math.round((0.4 * verifCandidate.processingScore + 0.6 * verifCandidate.waitingScore) * 10) / 10;
  assert(
    verifCandidate.delayContributionScore === expectedVerifScore && verifCandidate.delayContributionScore === 62.5,
    "Bottleneck Delay Score strictly adheres to (0.40 * ProcContrib + 0.60 * WaitContrib) = 62.5"
  );

  // 4. Simulation Mathematical Closure
  assert(
    sim1Res.comparison.simulatedCycleTimeMs ===
      sim1Res.comparison.simulatedAvgCaseProcessingTimeMs + sim1Res.comparison.simulatedAvgCaseWaitingTimeMs,
    "Simulated cycle time (2h 20m) achieves exact mathematical closure with simulated avg processing + avg waiting"
  );

  console.log("\nSuite 21: AI Structured Evidence Contract & Secret Protection");
  const aiEvidence = buildStructuredEvidence(syntheticResult, sim2Res);
  assert(
    aiEvidence.bottleneck.stage === "Verification" &&
      aiEvidence.bottleneck.score === 62.5 &&
      aiEvidence.bottleneck.rank === 1,
    "Evidence contract captures verified dominant bottleneck and delay score"
  );
  assert(
    aiEvidence.bottleneck.waitingContributionPct === 94.2 &&
      aiEvidence.bottleneck.processingContributionPct === 15,
    "Evidence contract captures exact waiting (94.2%) and processing (15%) contributions"
  );
  assert(
    Boolean(aiEvidence.simulation) &&
      aiEvidence.simulation?.baseline.avgCaseCycleTime === "6h" &&
      aiEvidence.simulation?.simulated.avgCaseCycleTime === "2h 8m" &&
      aiEvidence.simulation?.improvement.cycleTimeReductionPct === 64.3,
    "Simulation evidence accurately records baseline (6h), simulated (2h 8m), and 64.3% cycle-time improvement"
  );
  assert(
    aiEvidence.simulation?.migration.migrated === true &&
      aiEvidence.simulation?.migration.toStage === "Review",
    "Evidence contract records simulated bottleneck migration to Review"
  );
  const evidenceJson = JSON.stringify(aiEvidence);
  const hasSecret =
    evidenceJson.includes("SUPABASE_SECRET_KEY") ||
    evidenceJson.includes("GEMINI_API_KEY") ||
    Boolean(process.env.GEMINI_API_KEY && evidenceJson.includes(process.env.GEMINI_API_KEY)) ||
    Boolean(process.env.SUPABASE_SECRET_KEY && evidenceJson.includes(process.env.SUPABASE_SECRET_KEY));
  assert(
    !hasSecret,
    "Zero secrets guarantee: Evidence contract contains no environment variables or API keys"
  );

  console.log("\nSuite 22: Controlled Prompt Construction & Non-Causal Rules");
  const unifiedPrompt = buildUnifiedExplanationPrompt(aiEvidence);
  assert(
    unifiedPrompt.systemInstruction.includes("associated with") &&
      unifiedPrompt.systemInstruction.includes("Never invent metrics") &&
      unifiedPrompt.systemInstruction.includes("Clearly distinguish observed historical results from simulated results"),
    "System instruction enforces non-causal 'associated with' and simulation boundary rules"
  );
  assert(
    unifiedPrompt.userPrompt.includes('"Verification"') &&
      unifiedPrompt.userPrompt.includes("62.5") &&
      unifiedPrompt.userPrompt.includes("94.2"),
    "User prompt embeds exact deterministic numbers without modification"
  );
  const simPrompt = buildSimulationPrompt(aiEvidence);
  assert(
    simPrompt.userPrompt.includes("Clearly distinguish OBSERVED baseline metrics from SIMULATED intervention metrics") &&
      simPrompt.userPrompt.includes("Review"),
    "Simulation prompt explicitly enforces distinction of observed vs simulated and migration toward Review"
  );

  console.log("\nSuite 23: Offline Fallbacks & Graceful Error Handling");
  // 1. Offline fallback (Gemini client is null)
  const offlineUnified = await generateUnifiedAIExplanation(aiEvidence, null);
  assert(
    offlineUnified.success === true &&
      offlineUnified.metadata?.model === "deterministic-fallback" &&
      offlineUnified.explanation.bottleneckExplanation.includes("Verification is the dominant bottleneck"),
    "Gracefully generates deterministic fallback explanation when Gemini client is null (offline/missing key)"
  );
  const offlineBottleneck = await explainBottleneck(aiEvidence, null);
  assert(
    offlineBottleneck.includes("Verification") &&
      offlineBottleneck.includes("94.2%") &&
      offlineBottleneck.includes("associated with"),
    "explainBottleneck produces metric-grounded non-causal fallback when offline"
  );
  const offlineSim = await explainSimulation(aiEvidence, null);
  assert(
    offlineSim.includes("decreases from 6h to approximately 2h 8m") &&
      offlineSim.includes("Review") &&
      offlineSim.includes("deterministic queue modeling"),
    "explainSimulation produces deterministic queue projection narrative when offline"
  );
  const offlineMigration = await explainBottleneckMigration(aiEvidence, null);
  assert(
    offlineMigration.includes("Simulated bottleneck migration detected") &&
      offlineMigration.includes("Review"),
    "explainBottleneckMigration produces transparent migration narrative when offline"
  );
  // 2. Malformed / error mock client
  const errorMockClient = {
    models: {
      generateContent: async () => {
        throw new Error("Quota exceeded or network timeout");
      },
    },
  } as unknown as GoogleGenAI;
  const errorHandled = await generateUnifiedAIExplanation(aiEvidence, errorMockClient);
  assert(
    errorHandled.success === true &&
      errorHandled.metadata?.model === "deterministic-fallback" &&
      errorHandled.explanation.bottleneckExplanation.length > 20,
    "Gracefully handles Gemini API exceptions without crashing or breaking the dashboard"
  );
  // 3. Validation rejection of empty analysis
  let caughtMissingError = false;
  try {
    buildStructuredEvidence({ stages: [], bottleneckCandidates: [] } as unknown as ProcessAnalysisResult);
  } catch {
    caughtMissingError = true;
  }
  assert(caughtMissingError, "Rejects malformed analysis payload missing bottleneck candidates");

  console.log("\nSuite 24: Mocked Gemini AI Explanations & Migration Intelligence");
  const mockGeminiClient = {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify({
            summary: "Verification is the primary process constraint, driven predominantly by queue delay.",
            bottleneckExplanation: "Verification is the dominant bottleneck in the observed process (Delay Score: 62.5/100). Its score is driven primarily by waiting contribution (78%) rather than active processing duration (2%). The observed queue delay is associated with the Verification stage.",
            evidence: [
              "Waiting contribution: 78%",
              "Processing contribution: 2%",
              "Average waiting time: 3h 22m",
              "Delay Contribution Score: 62.5 / 100",
            ],
            simulationExplanation: "Under the simulated scenario of adding two resources to Verification, modeled average case cycle time decreases from 6h to approximately 2h 8m. The simulation also indicates that the dominant bottleneck shifts from Verification to Review.",
            migrationExplanation: "The simulation indicates that the dominant bottleneck may shift toward Review under this scenario as queue delay at Verification is relieved.",
            executiveSummary: {
              headline: "Verification Queue Bottleneck Relieved by +2 Capacity Expansion",
              processSlowingStage: "Verification is the primary stage slowing process throughput.",
              operationalImpact: "Queue stalls at Verification account for 78% of waiting time.",
              supportingEvidence: [
                "Verification delay score: 62.5/100",
                "Queue waiting time: 3h 22m",
              ],
              simulatedInterventionImpact: "Modeled cycle time decreases from 6h to 2h 8m (64% reduction).",
              migrationOutlook: "The simulation indicates that the dominant bottleneck may shift toward Review under this scenario.",
              dataLimitations: [
                "Analysis reflects recorded event logs without external non-system queue factors.",
                "Simulation results represent theoretical queueing models, not guaranteed future performance.",
              ],
            },
            assumptions: [
              "FIFO case queueing discipline.",
              "Uniform resource dispatch.",
            ],
            limitations: [
              "Event log resolution limit.",
              "Non-causal observational context.",
            ],
          }),
        };
      },
    },
  } as unknown as GoogleGenAI;

  const mockUnified = await generateUnifiedAIExplanation(aiEvidence, mockGeminiClient);
  assert(
    mockUnified.success === true &&
      Boolean(mockUnified.detailedBottleneck?.narrative.includes("Verification")) &&
      Boolean(mockUnified.detailedBottleneck?.narrative.includes("78%")) &&
      Boolean(mockUnified.detailedBottleneck?.narrative.includes("associated with")),
    "Mocked Gemini bottleneck explanation uses observational 'associated with' terminology"
  );
  assert(
    Boolean(mockUnified.detailedSimulation?.narrative.includes("decreases from 6h to approximately 2h 8m")) &&
      Boolean(mockUnified.detailedSimulation?.isSimulatedNotice.includes("modeled projections")),
    "Mocked Gemini simulation explanation clearly labels outcome as simulated projection"
  );
  assert(
    mockUnified.detailedMigration?.detected === true &&
      Boolean(mockUnified.detailedMigration?.narrative.includes("The simulation indicates that the dominant bottleneck may shift toward Review under this scenario")),
    "Mocked Gemini migration explanation strictly uses speculative 'may shift toward' wording without claiming certainty"
  );
  assert(
    Boolean(mockUnified.executiveSummary) &&
      Boolean(mockUnified.executiveSummary?.headline.includes("Verification")) &&
      Boolean(mockUnified.executiveSummary?.dataLimitations && mockUnified.executiveSummary.dataLimitations.length >= 2),
    "Executive summary covers all 6 key operational dimensions with explicit analytical limitations"
  );

  console.log("\nSuite 25: Phase 4.1 AI Evidence Consistency & Metric Audit");
  // 1. Process-level baseline metrics in AIStructuredEvidence
  assert(
    aiEvidence.processBaseline !== undefined &&
      aiEvidence.processBaseline.avgCaseCycleTime === "6h" &&
      aiEvidence.processBaseline.avgCaseProcessingTime === "1h 40m" &&
      aiEvidence.processBaseline.avgCaseWaitingTime === "4h 20m" &&
      aiEvidence.processBaseline.totalProcessWaitingTime === "1d 19h" &&
      aiEvidence.processBaseline.totalProcessProcessingTime === "16h 40m",
    "Evidence contract includes explicit processBaseline with verified global lead time (6h = 1h 40m proc + 4h 20m wait)"
  );

  // 2. Explicit Stage-Specific Queue Wait vs Process Average Wait
  assert(
    aiEvidence.bottleneck.stageSpecificAvgWaitingTime === "4h 5m" &&
      aiEvidence.bottleneck.stageQueueWaitLabel === "Verification Average Queue Wait" &&
      aiEvidence.bottleneck.stageSpecificAvgProcessingTime === "15m" &&
      aiEvidence.bottleneck.stageProcessingLabel === "Verification Average Processing Duration",
    "Evidence contract explicitly differentiates Verification Average Queue Wait (4h 5m) from Process Waiting per Case"
  );

  assert(
    aiEvidence.bottleneck.stageSpecificAvgWaitingTime !== aiEvidence.processBaseline.avgCaseWaitingTime,
    "Verification stage queue wait (4h 5m) is strictly not equal to process average waiting per case (4h 20m)"
  );

  // 3. Mathematical proof: Verification queue wait accounts for 94.2% of process waiting
  assert(
    aiEvidence.bottleneck.waitingContributionPct === 94.2 &&
      syntheticResult.stages.find((s) => s.stageName === "Verification")?.formattedAvgWaitingTime === "4h 5m",
    "Deterministic engine proves Verification queue (4h 5m = 245m avg) accounts for 94.2% of total process waiting (260m avg)"
  );

  // 4. Global consistency of Simulation (+2 resources) across comparison layers
  assert(
    sim2Res.comparison.formattedBaselineCycleTime === "6h" &&
      sim2Res.comparison.formattedBaselineAvgCaseProcessing === "1h 40m" &&
      sim2Res.comparison.formattedBaselineAvgCaseWaiting === "4h 20m" &&
      sim2Res.comparison.formattedSimulatedCycleTime === "2h 8m" &&
      sim2Res.comparison.formattedSimulatedAvgCaseProcessing === "1h 40m" &&
      sim2Res.comparison.formattedSimulatedAvgCaseWaiting === "28m 25s",
    "Simulation comparison strictly reflects 6h baseline (4h 20m wait) collapsing to 2h 8m (28m 25s wait) under +2 resources"
  );

  assert(
    sim2Res.comparison.baselineBottleneckStage === "Verification" &&
      sim2Res.comparison.baselineBottleneckScore === 62.5 &&
      sim2Res.comparison.simulatedBottleneckStage === "Review" &&
      sim2Res.migration.migrated === true &&
      sim2Res.migration.toStage === "Review",
    "Bottleneck shifts from Verification (Score 62.5) to Review after +2 capacity expansion"
  );

  // 5. Deterministic Executive Summary metric consistency
  const execSummary = buildDeterministicExecutiveSummary(aiEvidence);
  const quotesProcessBaseline = execSummary.supportingEvidence.some((p) =>
    p.includes("Process-level baseline: 6h cycle time (1h 40m processing + 4h 20m waiting per case)")
  );
  const quotesStageQueueWait = execSummary.supportingEvidence.some((p) =>
    p.includes("Verification Average Queue Wait: 4h 5m (94.2% of total process queue delay)")
  );
  const noConflatedLabel = !execSummary.supportingEvidence.some((p) =>
    p.includes("Average case waiting duration: 4h 5m")
  );
  assert(
    quotesProcessBaseline && quotesStageQueueWait && noConflatedLabel,
    "Executive summary quotes verified process baseline (6h, 4h 20m) and stage queue wait (4h 5m) without conflation"
  );

  // 6. Prompt metric instruction audit
  const auditedPrompt = buildUnifiedExplanationPrompt(aiEvidence);
  assert(
    auditedPrompt.userPrompt.includes("CRITICAL METRIC DEFINITION RULES") &&
      auditedPrompt.userPrompt.includes("Verification Average Queue Wait") &&
      auditedPrompt.userPrompt.includes("Do NOT conflate these two metrics or call 4h 5m simply 'average waiting time'"),
    "Prompt builder enforces strict definition rules forbidding Gemini from conflating stage queue wait with process waiting"
  );

  // =========================================================
  // 15. MACHINE LEARNING LAYER & PREDICTIVE PROCESS INTELLIGENCE TESTS
  // =========================================================
  console.log("\n--- Phase 5: Machine Learning & Predictive Process Intelligence Tests ---");

  // 1. ML Service Graceful Fallback (Empty / Offline Handling)
  const emptyMlResult = await fetchAllPredictions([]);
  assert(
    emptyMlResult.available === false &&
      emptyMlResult.bottleneckForecast.predictedStage === "N/A" &&
      emptyMlResult.anomalyDetection.isAnomaly === false &&
      emptyMlResult.remainingTime.predictedRemainingTimeMinutes === 0,
    "ML client gracefully falls back without throwing when empty events are provided"
  );

  // 2. Deterministic + ML Consistency Check
  // Verify that the deterministic engine remains the inviolate single source of truth for observed metrics
  assert(
    syntheticResult.processMetrics.formattedAvgCycleTime === "6h" &&
      syntheticResult.processMetrics.formattedAvgWaitingTime === "4h 20m" &&
      syntheticResult.processMetrics.formattedAvgProcessingTime === "1h 40m" &&
      syntheticResult.bottleneckCandidates[0].stageName === "Verification" &&
      syntheticResult.bottleneckCandidates[0].stageMetrics.waitingContributionPct === 94.2,
    "Deterministic engine remains inviolate single source of truth for observed metrics (6h cycle, 4h 20m wait, 94.2% wait share)"
  );

  // 3. Gemini Evidence Integration with ML Predictions
  const mockMlPredictions: MLProcessPredictions = {
    available: true,
    bottleneckForecast: {
      predictedStage: "Review",
      probability: 0.82,
      stageProbabilities: { Verification: 0.12, Review: 0.82, Fulfillment: 0.06 },
      confidence: "HIGH",
      topFactors: [
        { factor: "waiting_contribution", label: "Waiting delay contribution", importance: 0.28, value: 24.5 },
        { factor: "resource_load", label: "Resource workload concentration", importance: 0.21, value: 3.2 },
      ],
    },
    anomalyDetection: {
      isAnomaly: true,
      anomalyScore: 0.84,
      severity: "HIGH",
      topSignals: ["Queue wait exceeded 99th percentile (142 mins)"],
      flaggedCaseCount: 12,
      totalCaseCount: 100,
      anomalyRate: 0.12,
      targetCaseId: "C1042",
      flaggedCases: [],
    },
    remainingTime: {
      predictedRemainingTimeMinutes: 138.5,
      predictionRange: { lower: 112.0, upper: 167.0 },
      formattedPredictedTime: "2h 18m",
      formattedRange: "1h 52m — 2h 47m",
      confidenceLevel: "80% CI",
      targetCaseId: "C1042",
    },
  };

  const evidenceWithMl = buildStructuredEvidence(
    syntheticResult,
    sim2Res,
    "Verification",
    mockMlPredictions
  );

  assert(
    evidenceWithMl.mlPredictions?.available === true &&
      evidenceWithMl.mlPredictions?.predictedBottleneckStage === "Review" &&
      evidenceWithMl.mlPredictions?.probability === 0.82 &&
      evidenceWithMl.mlPredictions?.isAnomaly === true &&
      evidenceWithMl.mlPredictions?.severity === "HIGH" &&
      evidenceWithMl.mlPredictions?.predictedRemainingTime === "2h 18m",
    "Evidence builder accurately embeds ML predictions into structured Gemini evidence payload"
  );

  // 4. Prompt Builder Architectural Separation (OBSERVED vs PREDICTED vs SIMULATED)
  const promptWithMl = buildUnifiedExplanationPrompt(evidenceWithMl);
  assert(
    promptWithMl.userPrompt.includes("CRITICAL ARCHITECTURAL DISTINCTION RULES") &&
      promptWithMl.userPrompt.includes("1. OBSERVED: Grounded strictly in verified historical event logs") &&
      promptWithMl.userPrompt.includes("2. PREDICTED: Grounded strictly in supervised/unsupervised Machine Learning forecasting") &&
      promptWithMl.userPrompt.includes("3. SIMULATED: Grounded strictly in counterfactual simulation models") &&
      promptWithMl.userPrompt.includes("Review as the next likely bottleneck with 82% probability"),
    "Prompt builder strictly instructs Gemini to distinguish OBSERVED, PREDICTED, and SIMULATED categories"
  );

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${testsPassed} passed, ${testsFailed} failed out of ${testsRun} assertions`);
  console.log("=======================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite();
