/**
 * FlowLens AI - Prompt Construction Layer
 * Phase 4: Gemini AI Explanation Layer
 * Server-Only Module
 *
 * Formats strict, evidence-grounded prompt templates preventing hallucinated metrics
 * and enforcing observational "associated with" terminology.
 */

import { AIStructuredEvidence } from "@/shared/types";
import { FLOWLENS_SYSTEM_PROMPT } from "./constants";

/**
 * Builds the comprehensive prompt for generating a unified explanation
 */
export function buildUnifiedExplanationPrompt(evidence: AIStructuredEvidence): {
  systemInstruction: string;
  userPrompt: string;
} {
  const hasSimulation = Boolean(evidence.simulation);

  const userPrompt = `You are evaluating verified deterministic process analytics from FlowLens AI.
Explain the following structured evidence. Do not invent any numbers or modify supplied metrics.

==================================================
VERIFIED EVIDENCE CONTRACT (JSON)
==================================================
${JSON.stringify(evidence, null, 2)}

==================================================
CRITICAL METRIC DEFINITION RULES:
- '${evidence.processBaseline.avgCaseWaitingTime}' is the Process-Level Average Waiting Time per case across all stages.
- '${evidence.bottleneck.stageSpecificAvgWaitingTime}' is the Stage-Specific Queue Wait for ${evidence.bottleneck.stage} ('${evidence.bottleneck.stageQueueWaitLabel}'), representing ${evidence.bottleneck.waitingContributionPct}% of process waiting.
- Do NOT conflate these two metrics or call ${evidence.bottleneck.stageSpecificAvgWaitingTime} simply 'average waiting time'. Always qualify it as '${evidence.bottleneck.stageQueueWaitLabel}'.
- Process Average Case Cycle Time: ${evidence.processBaseline.avgCaseCycleTime} (${evidence.processBaseline.avgCaseProcessingTime} processing + ${evidence.processBaseline.avgCaseWaitingTime} waiting).
==================================================

==================================================
REQUIRED OUTPUT SPECIFICATION
==================================================
Respond with a single valid JSON object strictly matching this schema:

{
  "summary": "High-level summary (2-3 sentences) explaining the key finding, grounded strictly in the supplied metrics.",
  "bottleneckExplanation": "Detailed explanation of why the bottleneck stage is slowing down. Reference exact waiting contribution (${evidence.bottleneck.waitingContributionPct}%), processing contribution (${evidence.bottleneck.processingContributionPct}%), and delay score (${evidence.bottleneck.score}). Use observational language: 'associated with queue delay' or 'associated with workload concentration'. Do not claim causation.",
  "evidence": [
    "Array of 3-5 concise bullet points quoting exact verified metrics from the contract (e.g., 'Process average waiting per case: ${evidence.processBaseline.avgCaseWaitingTime}', '${evidence.bottleneck.stageQueueWaitLabel}: ${evidence.bottleneck.stageSpecificAvgWaitingTime} (${evidence.bottleneck.waitingContributionPct}% of process queue delay)', '${evidence.bottleneck.stageProcessingLabel}: ${evidence.bottleneck.stageSpecificAvgProcessingTime}', etc.)"
  ],
  ${
    hasSimulation
      ? `"simulationExplanation": "Explanation of the modeled intervention (${evidence.simulation?.interventionDescription}). Clearly distinguish OBSERVED baseline (${evidence.simulation?.baseline.avgCaseCycleTime}) from SIMULATED outcome (${evidence.simulation?.simulated.avgCaseCycleTime}). State that this is a modeled scenario, not a guaranteed future outcome.",
  "migrationExplanation": "Explanation of simulated bottleneck migration. ${
    evidence.simulation?.migration.migrated
      ? `State that the simulation indicates that the dominant bottleneck may shift toward ${evidence.simulation.migration.toStage} under this scenario.`
      : `State that the original bottleneck remains dominant under this scenario.`
  } Use 'simulated bottleneck migration'. Never say 'This will become the bottleneck'.",`
      : ""
  }
  "executiveSummary": {
    "headline": "Actionable executive headline (max 12 words)",
    "processSlowingStage": "Identifies the stage slowing the process and whether it is driven by queue waiting or active processing.",
    "operationalImpact": "Explains why this delay matters in terms of overall case cycle time.",
    "supportingEvidence": [
      "2-3 verified data points from the evidence"
    ],
    ${
      hasSimulation
        ? `"simulatedInterventionImpact": "Concise statement of simulated cycle-time and waiting reduction.",
    "migrationOutlook": "Concise statement on whether bottleneck migration is indicated.",`
        : ""
    }
    "dataLimitations": [
      "1-2 data limitations (e.g., 'Historical event log observations do not capture external queue factors outside system timestamps.')"
    ]
  },
  "assumptions": [
    "List of 2-3 key assumptions (e.g., queueing assumptions, FIFO dispatch, uniform resource availability)"
  ],
  "limitations": [
    "List of 2-3 operational limitations of the analysis"
  ]
}

Ensure the executive summary is concise (target 150-200 words total). Return ONLY the raw JSON object. Do not wrap in markdown or backticks if possible, or use standard json fencing.`;

  return {
    systemInstruction: FLOWLENS_SYSTEM_PROMPT,
    userPrompt,
  };
}

/**
 * Builds prompt specifically for explaining bottleneck root cause
 */
export function buildBottleneckPrompt(evidence: AIStructuredEvidence): {
  systemInstruction: string;
  userPrompt: string;
} {
  return {
    systemInstruction: FLOWLENS_SYSTEM_PROMPT,
    userPrompt: `Explain the root cause of delay for stage '${evidence.bottleneck.stage}' based strictly on this verified evidence:
${JSON.stringify(evidence.bottleneck, null, 2)}
Root cause signals:
${JSON.stringify(evidence.rootCause, null, 2)}

Provide a concise 2-3 paragraph explanation.
Use 'associated with' for observational data.
Never claim employee misconduct or causation.
Quote exact numbers from the evidence.`,
  };
}

/**
 * Builds prompt specifically for explaining simulation outcomes
 */
export function buildSimulationPrompt(evidence: AIStructuredEvidence): {
  systemInstruction: string;
  userPrompt: string;
} {
  if (!evidence.simulation) {
    throw new Error("Cannot build simulation prompt without simulation evidence.");
  }

  return {
    systemInstruction: FLOWLENS_SYSTEM_PROMPT,
    userPrompt: `Explain the modeled intervention outcome based strictly on this verified simulation evidence:
${JSON.stringify(evidence.simulation, null, 2)}

Requirements:
1. Clearly distinguish OBSERVED baseline metrics from SIMULATED intervention metrics.
2. Quote exact cycle time, waiting, and percentage reduction figures supplied.
3. State clearly that results are modeled projections, not guaranteed future outcomes.
4. Explain whether simulated bottleneck migration is detected (${
      evidence.simulation.migration.migrated
        ? `shift to ${evidence.simulation.migration.toStage}`
        : "no migration"
    }) using non-causal speculative phrasing ('may shift toward...').`,
  };
}
