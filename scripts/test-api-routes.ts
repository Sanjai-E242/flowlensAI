/**
 * Phase 4.1 API Verification Script
 * Validates:
 * 1. POST /api/datasets/analyze
 * 2. POST /api/simulation
 * 3. POST /api/ai/explain
 * 4. POST /api/ai/executive-summary
 */

import { SYNTHETIC_HIDDEN_BOTTLENECK_CSV } from "../src/data/synthetic-dataset";

async function verifyApis() {
  const baseUrl = "http://localhost:3000";
  console.log("Verifying API endpoints on", baseUrl);

  // 1. POST /api/datasets/analyze
  console.log("\n1. Testing POST /api/datasets/analyze...");
  const analyzeRes = await fetch(`${baseUrl}/api/datasets/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csv: SYNTHETIC_HIDDEN_BOTTLENECK_CSV,
      datasetName: "Synthetic Audit Dataset",
    }),
  });
  if (!analyzeRes.ok) {
    throw new Error(`Analyze API failed: ${analyzeRes.status} ${analyzeRes.statusText}`);
  }
  const analyzeData = await analyzeRes.json();
  if (!analyzeData.success) {
    throw new Error(`Analyze returned success: false: ${analyzeData.error}`);
  }
  const analysis = analyzeData.analysis;
  console.log("✓ /api/datasets/analyze OK");
  console.log(`  - Baseline Cycle Time: ${analysis.processMetrics.formattedAvgCycleTime}`);
  console.log(`  - Baseline Avg Processing: ${analysis.processMetrics.formattedAvgProcessingTime}`);
  console.log(`  - Baseline Avg Waiting: ${analysis.processMetrics.formattedAvgWaitingTime}`);
  console.log(`  - Dominant Bottleneck: ${analysis.bottleneckCandidates[0].stageName} (Score: ${analysis.bottleneckCandidates[0].delayContributionScore})`);

  // 2. POST /api/simulation
  console.log("\n2. Testing POST /api/simulation...");
  const simRes = await fetch(`${baseUrl}/api/simulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      datasetAnalysis: analysis,
      scenario: {
        name: "+2 Verification Operators",
        interventions: [
          {
            type: "RESOURCE_INCREASE",
            stage: "Verification",
            additionalResources: 2,
          },
        ],
      },
    }),
  });
  if (!simRes.ok) {
    throw new Error(`Simulation API failed: ${simRes.status} ${simRes.statusText}`);
  }
  const simData = await simRes.json();
  if (!simData.success) {
    throw new Error(`Simulation returned success: false: ${simData.error}`);
  }
  const simulation = simData;
  console.log("✓ /api/simulation OK");
  console.log(`  - Simulated Cycle Time: ${simulation.comparison.formattedSimulatedCycleTime}`);
  console.log(`  - Simulated Avg Waiting: ${simulation.comparison.formattedSimulatedAvgCaseWaiting}`);
  console.log(`  - Migrated: ${simulation.migration.migrated} -> ${simulation.migration.toStage}`);

  // 3. POST /api/ai/explain
  console.log("\n3. Testing POST /api/ai/explain...");
  const explainRes = await fetch(`${baseUrl}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis,
      simulation,
      targetStage: "Verification",
    }),
  });
  if (!explainRes.ok) {
    throw new Error(`Explain API failed: ${explainRes.status} ${explainRes.statusText}`);
  }
  const explainData = await explainRes.json();
  if (!explainData.success) {
    throw new Error(`Explain returned success: false: ${explainData.error}`);
  }
  console.log("✓ /api/ai/explain OK");
  console.log(`  - Model: ${explainData.metadata.model}`);
  console.log(`  - Evidence Process Lead Time: ${explainData.structuredEvidence.processBaseline.avgCaseCycleTime}`);
  console.log(`  - Evidence Process Avg Waiting: ${explainData.structuredEvidence.processBaseline.avgCaseWaitingTime}`);
  console.log(`  - Evidence Stage Queue Wait: ${explainData.structuredEvidence.bottleneck.stageQueueWaitLabel} = ${explainData.structuredEvidence.bottleneck.stageSpecificAvgWaitingTime}`);
  console.log(`  - Executive Summary Headline: ${explainData.executiveSummary?.headline}`);

  // 4. POST /api/ai/executive-summary
  console.log("\n4. Testing POST /api/ai/executive-summary...");
  const execRes = await fetch(`${baseUrl}/api/ai/executive-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis,
      simulation,
      targetStage: "Verification",
    }),
  });
  if (!execRes.ok) {
    throw new Error(`Executive summary API failed: ${execRes.status} ${execRes.statusText}`);
  }
  const execData = await execRes.json();
  if (!execData.success) {
    throw new Error(`Executive summary returned success: false: ${execData.error}`);
  }
  console.log("✓ /api/ai/executive-summary OK");
  console.log(`  - Headline: ${execData.executiveSummary.headline}`);
  console.log(`  - Supporting Evidence:`);
  for (const point of execData.executiveSummary.supportingEvidence) {
    console.log(`    * ${point}`);
  }

  console.log("\nALL 4 API ENDPOINTS VERIFIED SUCCESSFULLY!");
}

verifyApis().catch((err) => {
  console.error("API verification failed:", err);
  process.exit(1);
});
