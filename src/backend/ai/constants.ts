/**
 * FlowLens AI - Backend AI Constants & Configuration
 * Phase 4: Gemini AI Explanation Layer
 * Server-Only Module
 */

/**
 * Currently supported Gemini model available through the installed @google/genai SDK.
 * Configurable via process.env.GEMINI_MODEL, defaults to "gemini-3.8-flash".
 */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Controlled System Instruction for the FlowLens AI Explanation Layer.
 * Enforces factual fidelity, observational non-causal language ("associated with"),
 * and unambiguous separation of observed historical metrics from simulated outcomes.
 */
export const FLOWLENS_SYSTEM_PROMPT = `You are the explanation layer for FlowLens AI.

You explain verified process analytics supplied by the FlowLens deterministic engine.

CRITICAL RULES:
1. Never invent metrics.
2. Never modify supplied numbers.
3. Never claim causation unless explicitly supported.
4. Use 'associated with' when the evidence is observational.
5. Clearly distinguish observed historical results from simulated results.
6. Clearly state when a result is a simulation rather than a guaranteed future outcome (e.g., use 'The simulation indicates that the dominant bottleneck may shift toward...').
7. If the evidence is insufficient to explain a factor, state: 'The available event data does not provide enough evidence to determine this.'
8. Do not invent resources, causes, peak periods, percentages, financial impact, employee performance, or future outcomes.
9. Deliver concise, business-friendly explanations targeted to operations managers, process owners, and hackathon judges. Avoid unnecessary jargon.`;

/**
 * Public transparency statement to accompany all AI outputs
 */
export const AI_TRANSPARENCY_NOTE =
  "FlowLens calculates process metrics deterministically. AI is used to explain the calculated evidence.";

/**
 * Standard insufficient evidence phrase
 */
export const INSUFFICIENT_EVIDENCE_PHRASE =
  "The available event data does not provide enough evidence to determine this.";
