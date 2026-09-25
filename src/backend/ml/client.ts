/**
 * FlowLens AI - Server-Side Python ML Service Client
 * Proxies requests to FastAPI microservice with timeout and graceful fallback.
 * Zero exposed credentials, zero crashes if ML service is offline.
 */

import {
  BottleneckForecastResult,
  AnomalyDetectionResult,
  RemainingTimeResult,
  PredictAfterInterventionResult,
  MLProcessPredictions,
} from "@/shared/types";

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const ML_TIMEOUT_MS = 6000;

const FALLBACK_BOTTLENECK: BottleneckForecastResult = {
  predictedStage: "N/A",
  probability: 0.0,
  stageProbabilities: {},
  confidence: "LOW",
  topFactors: [],
  error: "Predictive model unavailable",
};

const FALLBACK_ANOMALY: AnomalyDetectionResult = {
  isAnomaly: false,
  anomalyScore: 0.0,
  severity: "LOW",
  topSignals: ["Predictive model unavailable"],
  flaggedCaseCount: 0,
  totalCaseCount: 0,
  anomalyRate: 0.0,
  flaggedCases: [],
  error: "Predictive model unavailable",
};

const FALLBACK_REMAINING: RemainingTimeResult = {
  predictedRemainingTimeMinutes: 0.0,
  predictionRange: { lower: 0.0, upper: 0.0 },
  formattedPredictedTime: "Unavailable",
  formattedRange: "Unavailable",
  confidenceLevel: "Unavailable",
  error: "Predictive model unavailable",
};

async function postToMlService<T>(endpoint: string, payload: unknown): Promise<{ data?: T; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { error: `ML Service returned status ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as T;
    return { data: json };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `ML Service offline or unreachable: ${msg}` };
  }
}

export async function fetchAllPredictions(
  events: unknown[],
  activeCaseId?: string
): Promise<MLProcessPredictions> {
  if (!events || events.length === 0) {
    return {
      available: false,
      bottleneckForecast: FALLBACK_BOTTLENECK,
      anomalyDetection: FALLBACK_ANOMALY,
      remainingTime: FALLBACK_REMAINING,
      error: "No process events provided.",
    };
  }

  const { data, error } = await postToMlService<{
    bottleneckForecast?: BottleneckForecastResult;
    anomalyDetection?: AnomalyDetectionResult;
    remainingTime?: RemainingTimeResult;
    error?: string;
  }>("/predict/all", { events, activeCaseId });

  if (error || !data || data.error) {
    return {
      available: false,
      bottleneckForecast: FALLBACK_BOTTLENECK,
      anomalyDetection: FALLBACK_ANOMALY,
      remainingTime: FALLBACK_REMAINING,
      serviceUrl: ML_SERVICE_URL,
      error: error || data?.error || "Predictive model unavailable",
    };
  }

  return {
    available: true,
    bottleneckForecast: data.bottleneckForecast || FALLBACK_BOTTLENECK,
    anomalyDetection: data.anomalyDetection || FALLBACK_ANOMALY,
    remainingTime: data.remainingTime || FALLBACK_REMAINING,
    serviceUrl: ML_SERVICE_URL,
  };
}

export async function fetchBottleneckForecast(events: unknown[]): Promise<BottleneckForecastResult> {
  const { data, error } = await postToMlService<BottleneckForecastResult>("/predict/bottleneck", { events });
  if (error || !data) {
    return { ...FALLBACK_BOTTLENECK, error: error || "Predictive model unavailable" };
  }
  return data;
}

export async function fetchAnomalyDetection(events: unknown[]): Promise<AnomalyDetectionResult> {
  const { data, error } = await postToMlService<AnomalyDetectionResult>("/predict/anomaly", { events });
  if (error || !data) {
    return { ...FALLBACK_ANOMALY, error: error || "Predictive model unavailable" };
  }
  return data;
}

export async function fetchRemainingTime(events: unknown[], activeCaseId?: string): Promise<RemainingTimeResult> {
  const { data, error } = await postToMlService<RemainingTimeResult>("/predict/remaining-time", { events, activeCaseId });
  if (error || !data) {
    return { ...FALLBACK_REMAINING, error: error || "Predictive model unavailable" };
  }
  return data;
}

export async function fetchInterventionPrediction(
  events: unknown[],
  intervention: Record<string, unknown>
): Promise<PredictAfterInterventionResult> {
  const { data, error } = await postToMlService<PredictAfterInterventionResult>("/predict/intervention", {
    events,
    intervention,
  });

  if (error || !data) {
    return {
      beforeBottleneck: "N/A",
      targetStage: String(intervention.targetStage || "N/A"),
      interventionDescription: "Intervention modeled",
      predictedNextBottleneck: "N/A",
      probability: 0.0,
      stageProbabilities: {},
      confidence: "LOW",
      migrationDetected: false,
      narrative: "Predictive model unavailable for intervention modeling.",
      error: error || "Predictive model unavailable",
    };
  }

  return data;
}
