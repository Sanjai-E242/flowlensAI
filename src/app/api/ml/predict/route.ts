/**
 * FlowLens AI - ML Single-Pass Unified Prediction API Route
 * POST /api/ml/predict
 * Phase 11: Next.js ML Integration
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchAllPredictions } from "@/backend/ml/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events, activeCaseId } = body as { events?: unknown[]; activeCaseId?: string };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: "Missing or empty 'events' array.",
        },
        { status: 400 }
      );
    }

    const predictions = await fetchAllPredictions(events, activeCaseId);

    return NextResponse.json({
      success: true,
      ...predictions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        available: false,
        error: `Internal proxy error: ${msg}`,
      },
      { status: 500 }
    );
  }
}
