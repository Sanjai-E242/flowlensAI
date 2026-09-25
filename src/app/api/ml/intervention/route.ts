/**
 * FlowLens AI - Predict After Intervention Proxy Route
 * POST /api/ml/intervention
 * Phase 15: What-If Simulation + ML Synthesis
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchInterventionPrediction } from "@/backend/ml/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events, intervention } = body as {
      events?: unknown[];
      intervention?: Record<string, unknown>;
    };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'events' array." },
        { status: 400 }
      );
    }

    const result = await fetchInterventionPrediction(events, intervention || {});
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Proxy error: ${msg}` },
      { status: 500 }
    );
  }
}
