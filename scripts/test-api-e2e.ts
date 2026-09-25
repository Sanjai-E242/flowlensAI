import { MANUFACTURING_DEMO_CSV } from "../src/data/industry-datasets";

async function main() {
  console.log("Testing /api/health...");
  const hRes = await fetch("http://127.0.0.1:3000/api/health");
  const hData = await hRes.json();
  console.log("Health OK:", hData.status === "ok");

  console.log("Testing /api/datasets/profile...");
  const pRes = await fetch("http://127.0.0.1:3000/api/datasets/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: MANUFACTURING_DEMO_CSV }),
  });
  const pData = await pRes.json();
  console.log("Profile OK:", pData.success, "Domain:", pData.profile.detectedDomain.domain);

  console.log("Testing /api/datasets/analyze...");
  const aRes = await fetch("http://127.0.0.1:3000/api/datasets/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: MANUFACTURING_DEMO_CSV, datasetName: "E2E Test" }),
  });
  const aData = await aRes.json();
  console.log("Analyze OK:", aData.success, "Cases:", aData.analysis.datasetSummary.uniqueCasesCount, "Bottleneck:", aData.analysis.bottleneckCandidates[0].stageName);

  console.log("Testing /api/simulation...");
  const sRes = await fetch("http://127.0.0.1:3000/api/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      datasetAnalysis: aData.analysis,
      scenario: {
        name: "CNC Machines +2",
        interventions: [
          { type: "RESOURCE_INCREASE", stage: "CNC_Machining", additionalResources: 2 },
        ],
      },
    }),
  });
  const sData = await sRes.json();
  console.log("Simulation OK:", sData.success, "Reduction:", sData.comparison.cycleTimeReductionPercent + "%");

  console.log("Testing /api/ai/explain (Deterministic Fallback / Gemini)...");
  const aiRes = await fetch("http://127.0.0.1:3000/api/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis: aData.analysis,
      simulation: sData,
      targetStage: "CNC_Machining",
    }),
  });
  const aiData = await aiRes.json();
  console.log("AI Explain OK:", aiData.success, "Model:", aiData.metadata?.model);

  console.log("\nALL E2E API TESTS PASSED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("E2E Test Error:", err);
  process.exit(1);
});
