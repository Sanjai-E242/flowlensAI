/**
 * FlowLens AI - Simulation API Route
 * POST /api/simulation
 * Phase 3: What-If Simulation Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { simulateScenario, validateSimulationScenario } from "@/backend/simulation";
import { ProcessAnalysisResult, SimulationScenario } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { datasetAnalysis, scenario } = body as {
      datasetAnalysis?: ProcessAnalysisResult;
      scenario?: SimulationScenario;
    };

    if (!datasetAnalysis || typeof datasetAnalysis !== "object" || !Array.isArray(datasetAnalysis.stages)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing 'datasetAnalysis'. Must provide an active ProcessAnalysisResult object.",
          code: "MISSING_ANALYSIS_DATA",
        },
        { status: 400 }
      );
    }

    if (!scenario || typeof scenario !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing 'scenario'. Must provide a valid SimulationScenario object.",
          code: "MISSING_SCENARIO",
        },
        { status: 400 }
      );
    }

    // Validate scenario parameters deterministically
    const validation = validateSimulationScenario(scenario, datasetAnalysis);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Simulation scenario validation failed.",
          errors: validation.errors,
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    // Execute deterministic simulation
    const result = simulateScenario(datasetAnalysis, scenario);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Simulation execution failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
