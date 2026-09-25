import { GoogleGenAI } from "@google/genai";

/**
 * FlowLens AI - Server-Only Google Gemini Integration
 * Backend AI Layer
 *
 * This module manages the Google Gemini API client for process explanation,
 * natural language interaction, and bottleneck narration.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. SERVER-ONLY: This file MUST NOT be imported into client components.
 * 2. DETERMINISTIC ENGINE SEPARATION: Gemini is strictly used for explanation,
 *    summarization, and natural language query interpretation. Deterministic
 *    bottleneck algorithms and process metrics calculation are performed by
 *    the algorithmic process engine, NEVER by the LLM.
 * 3. NO HARD-CODED KEYS: The API key is read solely from process.env.GEMINI_API_KEY.
 */

let geminiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  // Runtime assertion: Never run in browser
  if (typeof window !== "undefined") {
    throw new Error(
      "Security Exception: getGeminiClient was called in a browser environment. GEMINI_API_KEY must remain strictly server-side."
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[FlowLens AI] GEMINI_API_KEY is not configured in .env.local. Gemini explanation layer will operate in stub/standby mode."
      );
    }
    return null;
  }

  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({ apiKey });
  }

  return geminiClientInstance;
}

/**
 * Explanation Layer Contract / Placeholder
 *
 * Will be fully integrated in Phase 3 to produce human-readable
 * narrative insights grounded in calculated process mining metrics.
 */
export interface ProcessExplanationRequest {
  processName: string;
  bottleneckActivity: string;
  cycleTimeImpactHours: number;
  identifiedCauses: string[];
}

export interface ProcessExplanationResponse {
  summary: string;
  rootCauseNarration: string;
  recommendations: string[];
}
