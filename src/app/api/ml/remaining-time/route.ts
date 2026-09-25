/**
 * FlowLens AI - Process Remaining Time Prediction Proxy Route
 * POST /api/ml/remaining-time
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchRemainingTime } from "@/backend/ml/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events, activeCaseId } = body as { events?: unknown[]; activeCaseId?: string };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'events' array." },
        { status: 400 }
      );
    }

    const remaining = await fetchRemainingTime(events, activeCaseId);
    return NextResponse.json({ success: true, ...remaining });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Proxy error: ${msg}` },
      { status: 500 }
    );
  }
}
