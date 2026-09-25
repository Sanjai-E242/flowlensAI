/**
 * FlowLens AI - Executive Summary Route
 * POST /api/ai/executive-summary
 * Phase 4: Gemini AI Explanation Layer
 */

import { NextRequest, NextResponse } from "next/server";
import { buildStructuredEvidence, generateExecutiveSummary } from "@/backend/ai";
import { ProcessAnalysisResult, SimulationResult } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { analysis, simulation, targetStage } = body as {
      analysis?: ProcessAnalysisResult;
      simulation?: SimulationResult | null;
      targetStage?: string;
    };

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

    const evidence = buildStructuredEvidence(analysis, simulation, targetStage);
    const executiveSummary = await generateExecutiveSummary(evidence);

    return NextResponse.json({
      success: true,
      executiveSummary,
      evidenceSummary: {
        stage: evidence.bottleneck.stage,
        score: evidence.bottleneck.score,
        waitingContributionPct: evidence.bottleneck.waitingContributionPct,
        processingContributionPct: evidence.bottleneck.processingContributionPct,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate executive summary";
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: "EXECUTIVE_SUMMARY_ERROR",
      },
      { status: 500 }
    );
  }
}
