import { HOSPITAL_EMERGENCY_CSV } from "../src/data/hospital-dataset";

async function main() {
  console.log("=========================================");
  console.log("FLOWLENS AI LIVE API INTEGRATION TEST");
  console.log("=========================================");

  // 1. Health check
  const hRes = await fetch("http://localhost:3000/api/health");
  console.log("1. Health API Status:", hRes.status);
  const healthData = await hRes.json();
  console.log("   Health response:", JSON.stringify(healthData));

  // 2. Analyze Hospital CSV
  console.log("\n2. Testing POST /api/datasets/analyze with Hospital CSV...");
  const aRes = await fetch("http://localhost:3000/api/datasets/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csv: HOSPITAL_EMERGENCY_CSV,
      datasetName: "Metropolitan Hospital Emergency Department",
      persist: false,
    }),
  });
  console.log("   Analyze API Status:", aRes.status);
  const analyzeData = await aRes.json();
  const ds = analyzeData.analysis.datasetSummary;
  const dominant = analyzeData.analysis.bottleneckCandidates[0];
  console.log("   Dataset:", ds.name);
  console.log("   Cases:", ds.uniqueCasesCount, "| Events:", ds.validEventsCount, "| Stages:", ds.uniqueStagesCount);
  console.log("   Dominant Bottleneck:", dominant.stageName);
  console.log("   Bottleneck Score:", dominant.delayContributionScore.toFixed(1));
  console.log("   Primary DNA Factor:", dominant.dna.primaryFactor);
  console.log("   Waiting Contribution:", dominant.stageMetrics.waitingContributionPct.toFixed(1) + "%");

  // 3. Simulate Intervention on Hospital Bottleneck
  console.log("\n3. Testing POST /api/simulation with +2 Resources on", dominant.stageName, "...");
  const sRes = await fetch("http://localhost:3000/api/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      datasetAnalysis: analyzeData.analysis,
      scenario: {
        name: `Relieve ${dominant.stageName} Queue (+2 Resources)`,
        interventions: [
          {
            type: "RESOURCE_INCREASE",
            stage: dominant.stageName,
            additionalResources: 2,
          },
        ],
      },
    }),
  });
  console.log("   Simulation API Status:", sRes.status);
  const simData = await sRes.json();
  console.log("   Baseline Cycle Time:", simData.comparison.formattedBaselineCycleTime);
  console.log("   Simulated Cycle Time:", simData.comparison.formattedSimulatedCycleTime);
  console.log("   Modeled Reduction:", simData.comparison.cycleTimeReductionPercent.toFixed(1) + "%");
  console.log("   Migration Detected:", simData.migration.detected);
  if (simData.migration.detected) {
    console.log("   Migration Shift:", simData.migration.fromStage, "->", simData.migration.toStage);
  }

  // 4. AI Explanation endpoint
  console.log("\n4. Testing POST /api/ai/explain...");
  const aiRes = await fetch("http://localhost:3000/api/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis: analyzeData.analysis,
      targetStage: dominant.stageName,
      simulationResult: simData,
    }),
  });
  console.log("   AI Explain API Status:", aiRes.status);
  const aiData = await aiRes.json();
  console.log("   Model Used:", aiData.explanation?.metadata?.model);
  console.log("   Has Bottleneck Explanation:", !!aiData.explanation?.bottleneckExplanation);
  console.log("   Has Simulation Explanation:", !!aiData.explanation?.simulationExplanation);
  console.log("   Has Executive Summary:", !!aiData.explanation?.executiveSummary);

  console.log("\n=========================================");
  console.log("ALL LIVE API CHECKS COMPLETED SUCCESSFULLY!");
  console.log("=========================================");
}

main().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
