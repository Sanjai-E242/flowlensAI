import { analyzeProcess } from "../src/backend/engine";
import { profileCsvSchema } from "../src/backend/engine/schema-profiler";
import { simulateScenario } from "../src/backend/simulation";
import { SYNTHETIC_HIDDEN_BOTTLENECK_CSV } from "../src/data/synthetic-dataset";
import { HOSPITAL_EMERGENCY_CSV } from "../src/data/hospital-dataset";
import {
  MANUFACTURING_DEMO_CSV,
  LOGISTICS_DEMO_CSV,
  BANKING_DEMO_CSV,
  CUSTOMER_OPS_DEMO_CSV,
  UNUSUAL_COLUMNS_CSV,
} from "../src/data/industry-datasets";

console.log("=================================================================");
console.log("FLOWLENS AI: MULTI-INDUSTRY UNIVERSAL CSV VERIFICATION SUITE");
console.log("=================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details || ""}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// TEST 1: Synthetic Benchmark
// -------------------------------------------------------------
console.log("--- TEST 1: SYNTHETIC BENCHMARK (Hidden Queue Bottleneck) ---");
{
  const profile = profileCsvSchema(SYNTHETIC_HIDDEN_BOTTLENECK_CSV);
  assert(profile.isValid, "Schema profiled as valid");
  assert(profile.detectedMappings.case_id === "case_id", "Detected case_id mapping");
  assert(profile.detectedMappings.activity === "activity", "Detected activity mapping");

  const r = analyzeProcess(SYNTHETIC_HIDDEN_BOTTLENECK_CSV, { datasetName: "Synthetic Benchmark" });
  assert(r.datasetSummary.uniqueCasesCount === 10, "10 Cases reconstructed");
  assert(r.datasetSummary.validEventsCount === 50, "50 Events reconstructed");
  assert(r.bottleneckCandidates[0].stageName === "Verification", "Verification detected as Rank 1 Bottleneck");
  assert(r.bottleneckCandidates[0].dna.primaryFactor === "WAITING", "Bottleneck DNA is WAITING");
  assert(r.bottleneckCandidates[0].delayContributionScore > 60, "Bottleneck Score > 60 (is 62.5)");

  const sim = simulateScenario(r, {
    name: "Relieve Verification",
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Verification", additionalResources: 2 }],
  });
  assert(sim.migration.migrated === true, "Bottleneck migration detected to Review");
  assert(sim.comparison.cycleTimeReductionPercent > 50, "Cycle time improvement > 50% (is 64.3%)");
}

// -------------------------------------------------------------
// TEST 2: Healthcare Dataset
// -------------------------------------------------------------
console.log("\n--- TEST 2: HEALTHCARE CLINICAL FLOW ---");
{
  const profile = profileCsvSchema(HOSPITAL_EMERGENCY_CSV);
  assert(profile.isValid, "Healthcare schema is valid");
  assert(profile.detectedDomain.domain === "Healthcare", `Domain detected as Healthcare (got ${profile.detectedDomain.domain})`);

  const r = analyzeProcess(HOSPITAL_EMERGENCY_CSV, { datasetName: "Emergency Dept Log" });
  assert(r.stages.length >= 5, `Reconstructed ${r.stages.length} clinical stages`);
  assert(r.bottleneckCandidates.length > 0, "Identified clinical bottleneck");
  assert(r.domainInfo?.domain === "Healthcare", "Domain info correctly attached");

  const dominant = r.bottleneckCandidates[0].stageName;
  const sim = simulateScenario(r, {
    name: "Doctor Capacity +2",
    interventions: [{ type: "RESOURCE_INCREASE", stage: dominant, additionalResources: 2 }],
  });
  assert(sim.comparison.simulatedCycleTimeMs < sim.comparison.baselineCycleTimeMs, "Simulation reduces clinical cycle time");
}

// -------------------------------------------------------------
// TEST 3: Manufacturing Operations
// -------------------------------------------------------------
console.log("\n--- TEST 3: MANUFACTURING PRECISION FABRICATION ---");
{
  const profile = profileCsvSchema(MANUFACTURING_DEMO_CSV);
  assert(profile.isValid, "Manufacturing schema valid");
  assert(profile.detectedMappings.case_id === "order_id", "Mapped order_id -> case_id");
  assert(profile.detectedMappings.activity === "operation", "Mapped operation -> activity");
  assert(profile.detectedMappings.resource_id === "machine_id", "Mapped machine_id -> resource_id");
  assert(profile.detectedDomain.domain === "Manufacturing", `Domain detected as Manufacturing (got ${profile.detectedDomain.domain})`);

  const r = analyzeProcess(MANUFACTURING_DEMO_CSV, { datasetName: "Manufacturing Operations" });
  assert(r.stages.some(s => s.stageName === "CNC_Machining"), "Dynamic stage 'CNC_Machining' detected");
  assert(r.bottleneckCandidates[0].stageName === "CNC_Machining", "CNC_Machining identified as dominant bottleneck");
  assert(r.bottleneckCandidates[0].dna.primaryFactor === "WAITING", "CNC Machining queue identified as WAITING bottleneck");

  const sim = simulateScenario(r, {
    name: "Add CNC Capacity",
    interventions: [{ type: "RESOURCE_INCREASE", stage: "CNC_Machining", additionalResources: 2 }],
  });
  assert(sim.comparison.cycleTimeReductionPercent > 20, `Manufacturing cycle time reduced by > 20% (is ${sim.comparison.cycleTimeReductionPercent}%)`);
}

// -------------------------------------------------------------
// TEST 4: Logistics & Global Freight
// -------------------------------------------------------------
console.log("\n--- TEST 4: LOGISTICS & GLOBAL FREIGHT ---");
{
  const profile = profileCsvSchema(LOGISTICS_DEMO_CSV);
  assert(profile.isValid, "Logistics schema valid");
  assert(profile.detectedMappings.case_id === "shipment_number", "Mapped shipment_number -> case_id");
  assert(profile.detectedMappings.activity === "step", "Mapped step -> activity");
  assert(profile.detectedMappings.resource_id === "vehicle_unit", "Mapped vehicle_unit -> resource_id");
  assert(profile.detectedDomain.domain === "Logistics", `Domain detected as Logistics (got ${profile.detectedDomain.domain})`);

  const r = analyzeProcess(LOGISTICS_DEMO_CSV, { datasetName: "Freight Delivery Log" });
  assert(r.stages.some(s => s.stageName === "Customs_Clearance"), "Dynamic stage 'Customs_Clearance' detected");
  assert(r.bottleneckCandidates[0].stageName === "Customs_Clearance", "Customs Clearance identified as Rank 1 Bottleneck");

  const sim = simulateScenario(r, {
    name: "Automate Customs Inspection",
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Customs_Clearance", additionalResources: 2 }],
  });
  assert(sim.comparison.simulatedCycleTimeMs <= sim.comparison.baselineCycleTimeMs, "Logistics cycle time improved or optimized");
}

// -------------------------------------------------------------
// TEST 5: Banking / Commercial Underwriting
// -------------------------------------------------------------
console.log("\n--- TEST 5: BANKING & COMMERCIAL LOAN UNDERWRITING ---");
{
  const profile = profileCsvSchema(BANKING_DEMO_CSV);
  assert(profile.isValid, "Banking schema valid");
  assert(profile.detectedMappings.case_id === "application_ref", "Mapped application_ref -> case_id");
  assert(profile.detectedMappings.activity === "stage_name", "Mapped stage_name -> activity");
  assert(profile.detectedMappings.resource_id === "officer_id", "Mapped officer_id -> resource_id");
  assert(profile.detectedDomain.domain === "Banking", `Domain detected as Banking (got ${profile.detectedDomain.domain})`);

  const r = analyzeProcess(BANKING_DEMO_CSV, { datasetName: "Loan Origination Log" });
  assert(r.bottleneckCandidates[0].stageName === "Manual_Underwriting", "Manual Underwriting identified as Rank 1 Bottleneck");

  const sim = simulateScenario(r, {
    name: "+2 Senior Underwriters",
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Manual_Underwriting", additionalResources: 2 }],
  });
  assert(sim.comparison.simulatedCycleTimeMs <= sim.comparison.baselineCycleTimeMs, "Loan processing cycle time simulated");
}

// -------------------------------------------------------------
// TEST 6: Customer Support Operations
// -------------------------------------------------------------
console.log("\n--- TEST 6: CUSTOMER OPERATIONS & INCIDENT RESOLUTION ---");
{
  const profile = profileCsvSchema(CUSTOMER_OPS_DEMO_CSV);
  assert(profile.isValid, "Customer Ops schema valid");
  assert(profile.detectedMappings.case_id === "ticket_id", "Mapped ticket_id -> case_id");
  assert(profile.detectedMappings.activity === "action", "Mapped action -> activity");
  assert(profile.detectedMappings.resource_id === "agent_id", "Mapped agent_id -> resource_id");
  assert(profile.detectedDomain.domain === "Customer Operations", `Domain detected as Customer Operations (got ${profile.detectedDomain.domain})`);

  const r = analyzeProcess(CUSTOMER_OPS_DEMO_CSV, { datasetName: "Support Ticket Log" });
  assert(r.bottleneckCandidates[0].stageName === "Engineering_Escalation", "Engineering Escalation identified as Rank 1 Bottleneck");

  const sim = simulateScenario(r, {
    name: "Dedicate +2 Escalation Engineers",
    interventions: [{ type: "RESOURCE_INCREASE", stage: "Engineering_Escalation", additionalResources: 2 }],
  });
  assert(sim.comparison.simulatedCycleTimeMs <= sim.comparison.baselineCycleTimeMs, "Customer ops MTTR simulated");
}

// -------------------------------------------------------------
// TEST 7: Unusual but Valid Column Names
// -------------------------------------------------------------
console.log("\n--- TEST 7: UNUSUAL COLUMN NAMES ---");
{
  const profile = profileCsvSchema(UNUSUAL_COLUMNS_CSV);
  assert(profile.isValid, "Unusual column schema automatically resolved as valid");
  assert(profile.detectedMappings.case_id === "request_number", `Mapped request_number -> case_id (got ${profile.detectedMappings.case_id})`);
  assert(profile.detectedMappings.activity === "process_step", `Mapped process_step -> activity (got ${profile.detectedMappings.activity})`);
  assert(profile.detectedMappings.start_time === "started_at", `Mapped started_at -> start_time (got ${profile.detectedMappings.start_time})`);
  assert(profile.detectedMappings.end_time === "completed_at", `Mapped completed_at -> end_time (got ${profile.detectedMappings.end_time})`);
  assert(profile.detectedMappings.resource_id === "operator", `Mapped operator -> resource_id (got ${profile.detectedMappings.resource_id})`);

  const r = analyzeProcess(UNUSUAL_COLUMNS_CSV, { datasetName: "Unusual Column Dataset" });
  assert(r.datasetSummary.uniqueCasesCount === 3, "All 3 cases successfully reconstructed");
  assert(r.stages.length >= 3, "Stages dynamically discovered");
  assert(r.bottleneckCandidates.length > 0, "Bottleneck calculated with unusual column names");
}

// -------------------------------------------------------------
// TEST 8: Invalid CSV Handling
// -------------------------------------------------------------
console.log("\n--- TEST 8: INVALID / CORRUPT CSV HANDLING ---");
{
  const corruptCsv = "random;gibberish;without;headers\n1;2;3;4";
  const profile = profileCsvSchema(corruptCsv);
  assert(!profile.isValid, "Corrupt CSV flagged as invalid by profiler");
  assert(profile.missingRequiredColumns.length > 0, "Profiler identified missing required columns");

  const r = analyzeProcess(corruptCsv);
  assert(r.datasetSummary.validEventsCount === 0, "Zero valid events parsed for corrupt CSV");
  assert(
    r.validationErrors.some(e => e.message.includes("Unable to identify required column")),
    `Human-readable error provided: ${r.validationErrors[0]?.message}`
  );
}

// -------------------------------------------------------------
// TEST 9: Missing Case Identifier
// -------------------------------------------------------------
console.log("\n--- TEST 9: MISSING CASE IDENTIFIER ---");
{
  const missingCaseCsv = `activity,start_time,end_time,resource
Verification,2026-09-01 08:00:00,2026-09-01 08:30:00,User_1
Review,2026-09-01 08:30:00,2026-09-01 09:00:00,User_2`;

  const profile = profileCsvSchema(missingCaseCsv);
  assert(!profile.isValid, "Flagged invalid due to missing case_id");
  assert(profile.missingRequiredColumns.includes("case_id"), "Missing required column is case_id");

  const r = analyzeProcess(missingCaseCsv);
  assert(r.datasetSummary.validEventsCount === 0, "Zero valid events parsed without case_id");
  assert(
    r.validationErrors.some(e => e.message.includes("case_id")),
    "Validation error explicitly mentions missing case_id"
  );
}

// -------------------------------------------------------------
// TEST 10: Missing Timestamps
// -------------------------------------------------------------
console.log("\n--- TEST 10: MISSING TIMESTAMPS ---");
{
  const missingTimeCsv = `case_id,activity,resource
C_101,Step_1,Worker_1
C_101,Step_2,Worker_2`;

  const profile = profileCsvSchema(missingTimeCsv);
  assert(!profile.isValid, "Flagged invalid due to missing timestamps");
  assert(
    profile.missingRequiredColumns.includes("start_time") &&
    profile.missingRequiredColumns.includes("end_time"),
    "Profiler identifies missing start_time and end_time"
  );

  const r = analyzeProcess(missingTimeCsv);
  assert(r.datasetSummary.validEventsCount === 0, "Zero valid events parsed without timestamps");
  assert(
    r.validationErrors.some(e => e.message.includes("start_time") || e.message.includes("end_time")),
    "Validation error explicitly identifies missing timestamps"
  );
}

console.log("\n=================================================================");
console.log(`TOTAL ASSERTIONS PASSED: ${passedCount} / ${totalCount}`);
console.log("=================================================================\n");
