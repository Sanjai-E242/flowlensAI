/**
 * FlowLens AI - Multi-Scenario Simulation Comparison API Route
 * POST /api/simulation/compare
 * Phase 3: What-If Simulation Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { simulateScenario, validateSimulationScenario } from "@/backend/simulation";
import { ProcessAnalysisResult, SimulationScenario, SimulationResult } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { datasetAnalysis, scenarios } = body as {
      datasetAnalysis?: ProcessAnalysisResult;
      scenarios?: SimulationScenario[];
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

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty 'scenarios'. Must provide an array with at least one scenario.",
          code: "MISSING_SCENARIOS",
        },
        { status: 400 }
      );
    }

    const results: SimulationResult[] = [];
    const scenarioErrors: Array<{ index: number; errors: unknown[] }> = [];

    scenarios.forEach((scenario, index) => {
      const validation = validateSimulationScenario(scenario, datasetAnalysis);
      if (!validation.isValid) {
        scenarioErrors.push({ index, errors: validation.errors });
      } else {
        const result = simulateScenario(datasetAnalysis, scenario);
        results.push(result);
      }
    });

    if (scenarioErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more simulation scenarios failed validation.",
          scenarioErrors,
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Multi-scenario simulation failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
