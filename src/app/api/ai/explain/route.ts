/**
 * FlowLens AI - AI Explanation Route
 * POST /api/ai/explain
 * Phase 4: Gemini AI Explanation Layer
 */

import { NextRequest, NextResponse } from "next/server";
import { buildStructuredEvidence, generateUnifiedAIExplanation } from "@/backend/ai";
import { ProcessAnalysisResult, SimulationResult } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { analysis, simulation, targetStage, mlPredictions } = body as {
      analysis?: ProcessAnalysisResult;
      simulation?: SimulationResult | null;
      targetStage?: string;
      mlPredictions?: import("@/shared/types").MLProcessPredictions | null;
    };

    // Strict validation: Reject missing or malformed analysis
    if (
      !analysis ||
      typeof analysis !== "object" ||
      !Array.isArray(analysis.stages) ||
      !Array.isArray(analysis.bottleneckCandidates) ||
      analysis.bottleneckCandidates.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or missing 'analysis'. Must provide an active ProcessAnalysisResult with bottleneck candidates.",
          code: "INVALID_ANALYSIS_PAYLOAD",
        },
        { status: 400 }
      );
    }

    // Reject arbitrary prompt text injection attempts
    if ("prompt" in body || "instruction" in body || "systemPrompt" in body) {
      // We ignore or sanitize, and enforce that instructions come solely from deterministic evidence
      console.info(
        "[FlowLens AI] Custom prompt text in request ignored. Strictly using deterministic evidence contract."
      );
    }

    // Build sanitized structured evidence contract
    const evidence = buildStructuredEvidence(analysis, simulation, targetStage, mlPredictions);

    // Generate verified explanation via Gemini layer
    const result = await generateUnifiedAIExplanation(evidence);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate AI explanation";
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: "EXPLANATION_ERROR",
      },
      { status: 500 }
    );
  }
}
