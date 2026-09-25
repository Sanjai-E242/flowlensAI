/**
 * FlowLens AI - Bottleneck Forecast Proxy Route
 * POST /api/ml/bottleneck-forecast
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchBottleneckForecast } from "@/backend/ml/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body as { events?: unknown[] };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or empty 'events' array." },
        { status: 400 }
      );
    }

    const forecast = await fetchBottleneckForecast(events);
    return NextResponse.json({ success: true, ...forecast });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Proxy error: ${msg}` },
      { status: 500 }
    );
  }
}
