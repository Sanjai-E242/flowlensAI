import { NextResponse } from "next/server";

/**
 * FlowLens AI - System Health Check Endpoint
 *
 * Provides a minimal, secure status check verifying server availability.
 * STRICT SECURITY: Never exposes environment variables, secrets, or internal configs.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "FlowLens AI",
    phase: "Phase 4 (Gemini AI Explanation Layer & Executive Intelligence)",
    timestamp: new Date().toISOString(),
  });
}

