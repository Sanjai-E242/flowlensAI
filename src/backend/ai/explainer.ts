/**
 * FlowLens AI - AI Explainer Engine
 * Phase 4: Gemini AI Explanation Layer
 * Server-Only Module
 *
 * Interacts with the @google/genai SDK to generate grounded natural language explanations.
 * Implements strict response validation, secret stripping, and deterministic fallbacks.
 */

import { GoogleGenAI } from "@google/genai";
import {
  AIStructuredEvidence,
  AIExplanation,
  BottleneckExplanation,
  SimulationExplanation,
  MigrationExplanation,
  ExecutiveSummary,
  AIExplanationResponse,
} from "@/shared/types";
import { getGeminiClient } from "./gemini";
import {
  DEFAULT_GEMINI_MODEL,
  FLOWLENS_SYSTEM_PROMPT,
} from "./constants";
import {
  buildUnifiedExplanationPrompt,
  buildBottleneckPrompt,
  buildSimulationPrompt,
} from "./prompt-builder";

/**
 * Validate that response does not leak server secrets or credentials
 */
function sanitizeResponseText(text: string): string {
  let cleaned = text;

  // Mask any accidental occurrences of API keys or Supabase secrets
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.length > 5) {
    cleaned = cleaned.replaceAll(geminiKey, "[REDACTED_API_KEY]");
  }

  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (supabaseKey && supabaseKey.length > 5) {
    cleaned = cleaned.replaceAll(supabaseKey, "[REDACTED_SECRET_KEY]");
  }

  return cleaned;
}

/**
 * Clean markdown JSON wrappers from Gemini responses
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * Deterministic fallback generator for bottleneck explanation if Gemini is offline
 */
export function buildDeterministicBottleneckExplanation(
  evidence: AIStructuredEvidence
): string {
  const b = evidence.bottleneck;
  const base = evidence.processBaseline;
  const isWaiting = b.waitingContributionPct >= b.processingContributionPct;

  let explanation = `${b.stage} is the dominant bottleneck in the observed process (Delay Score: ${b.score}/100, Rank #${b.rank}). `;

  if (isWaiting) {
    explanation += `Its delay score is driven primarily by waiting contribution (${b.waitingContributionPct}%) rather than active processing duration (${b.processingContributionPct}%). `;
    explanation += `The observed queue delay is concentrated at ${b.stage}, where cases accumulate ${b.stageSpecificAvgWaitingTime || b.avgWaitingTime} average queue wait (${b.stageQueueWaitLabel || `${b.stage} Average Queue Wait`}) out of ${base.avgCaseWaitingTime} total process waiting per case.`;
  } else {
    explanation += `Its delay score is driven primarily by active processing duration (${b.processingContributionPct}%) rather than queue waiting (${b.waitingContributionPct}%). `;
    explanation += `The observed execution time is associated with processing duration at ${b.stage}, averaging ${b.stageSpecificAvgProcessingTime || b.avgProcessingTime} per case (${b.stageProcessingLabel || `${b.stage} Average Processing Duration`}).`;
  }

  if (evidence.rootCause.associatedResources.length > 0) {
    const topRes = evidence.rootCause.associatedResources[0];
    explanation += ` Delay patterns are associated with workload concentration around resource ${topRes.resourceId} (${topRes.workloadSharePct}% workload share).`;
  }

  return explanation;
}

/**
 * Deterministic fallback generator for simulation explanation if Gemini is offline
 */
export function buildDeterministicSimulationExplanation(
  evidence: AIStructuredEvidence
): string {
  if (!evidence.simulation) {
    return "No simulation scenario provided for interpretation.";
  }

  const sim = evidence.simulation;
  let explanation = `Under the simulated scenario of ${sim.interventionDescription.toLowerCase()}, `;
  explanation += `modeled average case cycle time decreases from ${sim.baseline.avgCaseCycleTime} to approximately ${sim.simulated.avgCaseCycleTime} `;
  explanation += `(a ${sim.improvement.cycleTimeReductionPct}% reduction). `;
  explanation += `Modeled case waiting time decreases from ${sim.baseline.avgCaseWaitingTime} to ${sim.simulated.avgCaseWaitingTime} `;
  explanation += `(${sim.improvement.waitingReductionPct}% queue relief). `;

  if (sim.migration.migrated && sim.migration.toStage) {
    explanation += `The simulation indicates that the dominant bottleneck may shift toward ${sim.migration.toStage} under this scenario. `;
  } else {
    explanation += `The simulation indicates that ${sim.baseline.bottleneckStage} remains the primary bottleneck under this intervention. `;
  }

  explanation += `Note: These values reflect deterministic queue modeling rather than guaranteed future outcomes.`;
  return explanation;
}

/**
 * Deterministic fallback generator for bottleneck migration if Gemini is offline
 */
export function buildDeterministicMigrationExplanation(
  evidence: AIStructuredEvidence
): string {
  if (!evidence.simulation) {
    return "No simulation scenario evaluated.";
  }

  const m = evidence.simulation.migration;
  if (m.migrated && m.toStage) {
    return `Simulated bottleneck migration detected: When relief is applied to ${m.fromStage}, the simulation indicates that the dominant bottleneck may shift toward ${m.toStage}. This occurs because relieving upstream queue delays exposes downstream stage latencies.`;
  }

  return `No simulated bottleneck migration detected: Under this intervention, ${m.fromStage} remains the primary constraint in the modeled process.`;
}

/**
 * Deterministic fallback generator for executive summary if Gemini is offline
 */
export function buildDeterministicExecutiveSummary(
  evidence: AIStructuredEvidence
): ExecutiveSummary {
  const b = evidence.bottleneck;
  const sim = evidence.simulation;
  const base = evidence.processBaseline;

  const headline = `${b.stage} Identified as Primary Bottleneck (${b.waitingContributionPct}% Queue Delay)`;
  const processSlowingStage = `${b.stage} accounts for the greatest process stall, driven predominantly by ${
    b.waitingContributionPct >= b.processingContributionPct ? "idle queue waiting" : "active processing duration"
  } (Score: ${b.score}/100).`;
  const operationalImpact = `Cases average ${b.stageSpecificAvgWaitingTime || b.avgWaitingTime} queue delay at ${b.stage} (${b.stageQueueWaitLabel || `${b.stage} Average Queue Wait`}), which accounts for ${b.waitingContributionPct}% of total process waiting and drives process-level cycle time to ${base.avgCaseCycleTime} (${base.avgCaseWaitingTime} avg queue wait per case).`;

  const supportingEvidence = [
    `Process-level baseline: ${base.avgCaseCycleTime} cycle time (${base.avgCaseProcessingTime} processing + ${base.avgCaseWaitingTime} waiting per case)`,
    `${b.stageQueueWaitLabel || `${b.stage} Average Queue Wait`}: ${b.stageSpecificAvgWaitingTime || b.avgWaitingTime} (${b.waitingContributionPct}% of total process queue delay)`,
    `${b.stageProcessingLabel || `${b.stage} Average Processing Duration`}: ${b.stageSpecificAvgProcessingTime || b.avgProcessingTime} (${b.processingContributionPct}% of active work)`,
  ];

  let simulatedInterventionImpact: string | undefined;
  let migrationOutlook: string | undefined;

  if (sim) {
    simulatedInterventionImpact = `Modeled intervention (${sim.interventionDescription}) projects a ${sim.improvement.cycleTimeReductionPct}% cycle-time reduction (from ${sim.baseline.avgCaseCycleTime} to ${sim.simulated.avgCaseCycleTime}).`;
    migrationOutlook = sim.migration.migrated
      ? `Simulated migration indicates constraint may shift toward ${sim.migration.toStage}.`
      : `Constraint remains at ${sim.baseline.bottleneckStage}.`;
  }

  const dataLimitations = [
    "Analysis reflects recorded event logs without external non-system queue factors.",
    "Simulation outcomes represent theoretical queueing models, not guaranteed future performance.",
  ];

  return {
    headline,
    processSlowingStage,
    operationalImpact,
    supportingEvidence,
    simulatedInterventionImpact,
    migrationOutlook,
    dataLimitations,
    wordCount: 165,
  };
}

/**
 * Generate a standalone bottleneck explanation
 */
export async function explainBottleneck(
  evidence: AIStructuredEvidence,
  clientOverride?: GoogleGenAI | null
): Promise<string> {
  const client = clientOverride !== undefined ? clientOverride : getGeminiClient();

  if (!client) {
    return buildDeterministicBottleneckExplanation(evidence);
  }

  try {
    const { systemInstruction, userPrompt } = buildBottleneckPrompt(evidence);
    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Near-deterministic factual adherence
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return buildDeterministicBottleneckExplanation(evidence);
    }

    return sanitizeResponseText(rawText);
  } catch (err) {
    console.warn("[FlowLens AI] explainBottleneck failed, using deterministic fallback:", err);
    return buildDeterministicBottleneckExplanation(evidence);
  }
}

/**
 * Generate a standalone simulation explanation
 */
export async function explainSimulation(
  evidence: AIStructuredEvidence,
  clientOverride?: GoogleGenAI | null
): Promise<string> {
  if (!evidence.simulation) {
    return "No simulation scenario provided for interpretation.";
  }

  const client = clientOverride !== undefined ? clientOverride : getGeminiClient();

  if (!client) {
    return buildDeterministicSimulationExplanation(evidence);
  }

  try {
    const { systemInstruction, userPrompt } = buildSimulationPrompt(evidence);
    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return buildDeterministicSimulationExplanation(evidence);
    }

    return sanitizeResponseText(rawText);
  } catch (err) {
    console.warn("[FlowLens AI] explainSimulation failed, using deterministic fallback:", err);
    return buildDeterministicSimulationExplanation(evidence);
  }
}

/**
 * Generate a standalone bottleneck migration explanation
 */
export async function explainBottleneckMigration(
  evidence: AIStructuredEvidence,
  clientOverride?: GoogleGenAI | null
): Promise<string> {
  if (!evidence.simulation) {
    return "No simulation scenario evaluated.";
  }

  const client = clientOverride !== undefined ? clientOverride : getGeminiClient();

  if (!client) {
    return buildDeterministicMigrationExplanation(evidence);
  }

  try {
    const prompt = `Explain the bottleneck migration result:
Original Bottleneck: ${evidence.simulation.baseline.bottleneckStage} (Score: ${evidence.simulation.baseline.bottleneckScore})
Intervention: ${evidence.simulation.interventionDescription}
Migration Detected: ${evidence.simulation.migration.migrated}
Pattern: ${evidence.simulation.migration.pattern}
New Bottleneck Stage: ${evidence.simulation.migration.toStage || "None"}
Simulated Top Score: ${evidence.simulation.simulated.bottleneckScore}

Requirements:
- Use 'simulated bottleneck migration'.
- If migration occurred, state that the simulation indicates that the dominant bottleneck may shift toward ${evidence.simulation.migration.toStage}.
- Never say 'this will become the bottleneck'.
- Keep explanation under 100 words.`;

    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: FLOWLENS_SYSTEM_PROMPT,
        temperature: 0.1,
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return buildDeterministicMigrationExplanation(evidence);
    }

    return sanitizeResponseText(rawText);
  } catch (err) {
    console.warn(
      "[FlowLens AI] explainBottleneckMigration failed, using deterministic fallback:",
      err
    );
    return buildDeterministicMigrationExplanation(evidence);
  }
}

/**
 * Generate a standalone executive summary
 */
export async function generateExecutiveSummary(
  evidence: AIStructuredEvidence,
  clientOverride?: GoogleGenAI | null
): Promise<ExecutiveSummary> {
  const unified = await generateUnifiedAIExplanation(evidence, clientOverride);
  if (unified.executiveSummary) {
    return unified.executiveSummary;
  }
  return buildDeterministicExecutiveSummary(evidence);
}

function buildDetailedFallbackOutputs(
  evidence: AIStructuredEvidence,
  explanation: AIExplanation,
  fallbackBottleneck: string,
  fallbackSimulation?: string,
  fallbackMigration?: string
) {
  const detailedBottleneck: BottleneckExplanation = {
    stage: evidence.bottleneck.stage,
    headline: `Delay Concentration at ${evidence.bottleneck.stage}`,
    narrative: fallbackBottleneck,
    keyFactors: {
      primarySignal: evidence.rootCause.primarySignal,
      waitingContributionPct: evidence.bottleneck.waitingContributionPct,
      processingContributionPct: evidence.bottleneck.processingContributionPct,
      delayScore: evidence.bottleneck.score,
    },
    evidencePoints: explanation.evidence,
  };

  let detailedSimulation: SimulationExplanation | undefined;
  let detailedMigration: MigrationExplanation | undefined;

  if (evidence.simulation && fallbackSimulation) {
    detailedSimulation = {
      headline: `Simulated Intervention: ${evidence.simulation.interventionDescription}`,
      narrative: fallbackSimulation,
      modeledIntervention: evidence.simulation.interventionDescription,
      baselineVsSimulated: {
        cycleTime: {
          baseline: evidence.simulation.baseline.avgCaseCycleTime,
          simulated: evidence.simulation.simulated.avgCaseCycleTime,
          reductionPct: evidence.simulation.improvement.cycleTimeReductionPct,
        },
        waitingTime: {
          baseline: evidence.simulation.baseline.avgCaseWaitingTime,
          simulated: evidence.simulation.simulated.avgCaseWaitingTime,
          reductionPct: evidence.simulation.improvement.waitingReductionPct,
        },
        processingTime: {
          baseline: evidence.simulation.baseline.avgCaseProcessingTime,
          simulated: evidence.simulation.simulated.avgCaseProcessingTime,
          reductionPct: evidence.simulation.improvement.processingReductionPct,
        },
      },
      isSimulatedNotice:
        "Results are modeled projections under theoretical queueing assumptions, not guaranteed future performance.",
    };

    detailedMigration = {
      detected: evidence.simulation.migration.migrated,
      pattern: evidence.simulation.migration.pattern,
      narrative: fallbackMigration || "",
      fromStage: evidence.simulation.migration.fromStage,
      toStage: evidence.simulation.migration.toStage,
      caveat:
        "The simulation indicates that the dominant bottleneck may shift under this scenario.",
    };
  }

  return { detailedBottleneck, detailedSimulation, detailedMigration };
}

/**
 * Generate comprehensive unified AI explanation in a single efficient Gemini call
 */
export async function generateUnifiedAIExplanation(
  evidence: AIStructuredEvidence,
  clientOverride?: GoogleGenAI | null
): Promise<AIExplanationResponse> {
  const client = clientOverride !== undefined ? clientOverride : getGeminiClient();

  // If Gemini client is unavailable (e.g., no key configured in environment), use deterministic fallback
  if (!client) {
    const fallbackBottleneck = buildDeterministicBottleneckExplanation(evidence);
    const fallbackSimulation = evidence.simulation
      ? buildDeterministicSimulationExplanation(evidence)
      : undefined;
    const fallbackMigration = evidence.simulation
      ? buildDeterministicMigrationExplanation(evidence)
      : undefined;
    const fallbackExec = buildDeterministicExecutiveSummary(evidence);

    const explanation: AIExplanation = {
      summary: `${evidence.bottleneck.stage} is the primary process constraint (Delay Score: ${evidence.bottleneck.score}/100), driven by ${evidence.bottleneck.waitingContributionPct}% queue delay.`,
      bottleneckExplanation: fallbackBottleneck,
      evidence: [
        `Process-level baseline: ${evidence.processBaseline.avgCaseCycleTime} cycle time (${evidence.processBaseline.avgCaseProcessingTime} processing + ${evidence.processBaseline.avgCaseWaitingTime} waiting per case)`,
        `Waiting contribution: ${evidence.bottleneck.waitingContributionPct}% vs Processing: ${evidence.bottleneck.processingContributionPct}%`,
        `${evidence.bottleneck.stageQueueWaitLabel || `${evidence.bottleneck.stage} Average Queue Wait`}: ${evidence.bottleneck.stageSpecificAvgWaitingTime || evidence.bottleneck.avgWaitingTime}`,
        `${evidence.bottleneck.stageProcessingLabel || `${evidence.bottleneck.stage} Average Processing Duration`}: ${evidence.bottleneck.stageSpecificAvgProcessingTime || evidence.bottleneck.avgProcessingTime}`,
      ],
      simulationExplanation: fallbackSimulation,
      migrationExplanation: fallbackMigration,
      assumptions: [
        "First-in, first-out (FIFO) case queueing discipline.",
        "Deterministic duration distributions based on historical log timestamps.",
      ],
      limitations: [
        "Analysis is bounded by the recorded start and end event timestamps in the dataset.",
        "Simulation projects theoretical queue response and does not account for external human fatigue.",
      ],
    };

    const { detailedBottleneck, detailedSimulation, detailedMigration } =
      buildDetailedFallbackOutputs(
        evidence,
        explanation,
        fallbackBottleneck,
        fallbackSimulation,
        fallbackMigration
      );

    return {
      success: true,
      explanation,
      detailedBottleneck,
      detailedSimulation,
      detailedMigration,
      executiveSummary: fallbackExec,
      structuredEvidence: evidence,
      metadata: {
        model: "deterministic-fallback",
        generatedAt: new Date().toISOString(),
        isSimulated: Boolean(evidence.simulation),
      },
    };
  }

  try {
    const { systemInstruction, userPrompt } = buildUnifiedExplanationPrompt(evidence);

    const response = await client.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // High deterministic fidelity
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("Received empty text response from Gemini API.");
    }

    const cleanedText = sanitizeResponseText(cleanJsonString(rawText));
    const parsed = JSON.parse(cleanedText);

    // Validate required fields
    if (!parsed.summary || !parsed.bottleneckExplanation) {
      throw new Error("Gemini response missing mandatory summary or bottleneckExplanation fields.");
    }

    const explanation: AIExplanation = {
      summary: parsed.summary,
      bottleneckExplanation: parsed.bottleneckExplanation,
      evidence: Array.isArray(parsed.evidence)
        ? parsed.evidence
        : [
            `Process-level baseline: ${evidence.processBaseline.avgCaseCycleTime} cycle time (${evidence.processBaseline.avgCaseProcessingTime} processing + ${evidence.processBaseline.avgCaseWaitingTime} waiting per case)`,
            `Waiting contribution: ${evidence.bottleneck.waitingContributionPct}% vs Processing: ${evidence.bottleneck.processingContributionPct}%`,
            `${evidence.bottleneck.stageQueueWaitLabel || `${evidence.bottleneck.stage} Average Queue Wait`}: ${evidence.bottleneck.stageSpecificAvgWaitingTime || evidence.bottleneck.avgWaitingTime}`,
          ],
      simulationExplanation: parsed.simulationExplanation || undefined,
      migrationExplanation: parsed.migrationExplanation || undefined,
      assumptions: Array.isArray(parsed.assumptions)
        ? parsed.assumptions
        : ["Historical event log consistency", "Observational correlation"],
      limitations: Array.isArray(parsed.limitations)
        ? parsed.limitations
        : ["Event log resolution limit", "Non-causal observational context"],
    };

    const detailedBottleneck: BottleneckExplanation = {
      stage: evidence.bottleneck.stage,
      headline: `Delay Concentration at ${evidence.bottleneck.stage}`,
      narrative: parsed.bottleneckExplanation,
      keyFactors: {
        primarySignal: evidence.rootCause.primarySignal,
        waitingContributionPct: evidence.bottleneck.waitingContributionPct,
        processingContributionPct: evidence.bottleneck.processingContributionPct,
        delayScore: evidence.bottleneck.score,
      },
      evidencePoints: explanation.evidence,
    };

    let detailedSimulation: SimulationExplanation | undefined;
    let detailedMigration: MigrationExplanation | undefined;

    if (evidence.simulation) {
      detailedSimulation = {
        headline: `Simulated Intervention: ${evidence.simulation.interventionDescription}`,
        narrative:
          parsed.simulationExplanation ||
          buildDeterministicSimulationExplanation(evidence),
        modeledIntervention: evidence.simulation.interventionDescription,
        baselineVsSimulated: {
          cycleTime: {
            baseline: evidence.simulation.baseline.avgCaseCycleTime,
            simulated: evidence.simulation.simulated.avgCaseCycleTime,
            reductionPct: evidence.simulation.improvement.cycleTimeReductionPct,
          },
          waitingTime: {
            baseline: evidence.simulation.baseline.avgCaseWaitingTime,
            simulated: evidence.simulation.simulated.avgCaseWaitingTime,
            reductionPct: evidence.simulation.improvement.waitingReductionPct,
          },
          processingTime: {
            baseline: evidence.simulation.baseline.avgCaseProcessingTime,
            simulated: evidence.simulation.simulated.avgCaseProcessingTime,
            reductionPct: evidence.simulation.improvement.processingReductionPct,
          },
        },
        isSimulatedNotice:
          "Results are modeled projections under theoretical queueing assumptions, not guaranteed future performance.",
      };

      detailedMigration = {
        detected: evidence.simulation.migration.migrated,
        pattern: evidence.simulation.migration.pattern,
        narrative:
          parsed.migrationExplanation ||
          buildDeterministicMigrationExplanation(evidence),
        fromStage: evidence.simulation.migration.fromStage,
        toStage: evidence.simulation.migration.toStage,
        caveat:
          "The simulation indicates that the dominant bottleneck may shift under this scenario.",
      };
    }

    const executiveSummary: ExecutiveSummary = parsed.executiveSummary
      ? {
          headline: parsed.executiveSummary.headline || "Process Constraint Analysis",
          processSlowingStage:
            parsed.executiveSummary.processSlowingStage ||
            `${evidence.bottleneck.stage} accounts for the greatest delay in the observed process.`,
          operationalImpact:
            parsed.executiveSummary.operationalImpact ||
            `Queue accumulation at ${evidence.bottleneck.stage} directly inflates total case lead times.`,
          supportingEvidence: Array.isArray(parsed.executiveSummary.supportingEvidence)
            ? parsed.executiveSummary.supportingEvidence
            : explanation.evidence,
          simulatedInterventionImpact: parsed.executiveSummary.simulatedInterventionImpact,
          migrationOutlook: parsed.executiveSummary.migrationOutlook,
          dataLimitations: Array.isArray(parsed.executiveSummary.dataLimitations)
            ? parsed.executiveSummary.dataLimitations
            : explanation.limitations,
          wordCount: Math.round(
            (parsed.bottleneckExplanation.split(/\s+/).length +
              (parsed.simulationExplanation || "").split(/\s+/).length) *
              0.8
          ),
        }
      : buildDeterministicExecutiveSummary(evidence);

    return {
      success: true,
      explanation,
      detailedBottleneck,
      detailedSimulation,
      detailedMigration,
      executiveSummary,
      structuredEvidence: evidence,
      metadata: {
        model: DEFAULT_GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
        isSimulated: Boolean(evidence.simulation),
      },
    };
  } catch (err) {
    console.warn(
      "[FlowLens AI] Gemini generateContent failed or malformed JSON, falling back to deterministic explanation:",
      err
    );

    // Fallback safely to guarantee dashboard continuity
    const fallbackBottleneck = buildDeterministicBottleneckExplanation(evidence);
    const fallbackSimulation = evidence.simulation
      ? buildDeterministicSimulationExplanation(evidence)
      : undefined;
    const fallbackMigration = evidence.simulation
      ? buildDeterministicMigrationExplanation(evidence)
      : undefined;
    const fallbackExec = buildDeterministicExecutiveSummary(evidence);

    const explanation: AIExplanation = {
      summary: `${evidence.bottleneck.stage} is the primary process constraint (Delay Score: ${evidence.bottleneck.score}/100), driven by ${evidence.bottleneck.waitingContributionPct}% queue delay.`,
      bottleneckExplanation: fallbackBottleneck,
      evidence: [
        `Process-level baseline: ${evidence.processBaseline.avgCaseCycleTime} cycle time (${evidence.processBaseline.avgCaseProcessingTime} processing + ${evidence.processBaseline.avgCaseWaitingTime} waiting per case)`,
        `Waiting contribution: ${evidence.bottleneck.waitingContributionPct}% vs Processing: ${evidence.bottleneck.processingContributionPct}%`,
        `${evidence.bottleneck.stageQueueWaitLabel || `${evidence.bottleneck.stage} Average Queue Wait`}: ${evidence.bottleneck.stageSpecificAvgWaitingTime || evidence.bottleneck.avgWaitingTime}`,
        `${evidence.bottleneck.stageProcessingLabel || `${evidence.bottleneck.stage} Average Processing Duration`}: ${evidence.bottleneck.stageSpecificAvgProcessingTime || evidence.bottleneck.avgProcessingTime}`,
      ],
      simulationExplanation: fallbackSimulation,
      migrationExplanation: fallbackMigration,
      assumptions: [
        "First-in, first-out (FIFO) case queueing discipline.",
        "Deterministic duration distributions based on historical log timestamps.",
      ],
      limitations: [
        "Analysis is bounded by the recorded start and end event timestamps in the dataset.",
        "Simulation projects theoretical queue response and does not account for external human fatigue.",
      ],
    };

    const { detailedBottleneck, detailedSimulation, detailedMigration } =
      buildDetailedFallbackOutputs(
        evidence,
        explanation,
        fallbackBottleneck,
        fallbackSimulation,
        fallbackMigration
      );

    return {
      success: true,
      explanation,
      detailedBottleneck,
      detailedSimulation,
      detailedMigration,
      executiveSummary: fallbackExec,
      structuredEvidence: evidence,
      metadata: {
        model: "deterministic-fallback",
        generatedAt: new Date().toISOString(),
        isSimulated: Boolean(evidence.simulation),
      },
    };
  }
}
