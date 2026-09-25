/**
 * FlowLens AI - Machine Learning & Predictive Process Intelligence Types
 * Shared Layer (Browser & Server safe)
 */

export interface TopFactorSignal {
  factor: string;
  label: string;
  importance: number;
  value: number;
}

export interface BottleneckForecastResult {
  predictedStage: string;
  probability: number;
  stageProbabilities: Record<string, number>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  topFactors: TopFactorSignal[];
  error?: string;
}

export interface FlaggedAnomalyCase {
  caseId: string;
  anomalyScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  topSignals: string[];
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  topSignals: string[];
  flaggedCaseCount: number;
  totalCaseCount: number;
  anomalyRate: number;
  targetCaseId?: string;
  flaggedCases: FlaggedAnomalyCase[];
  error?: string;
}

export interface RemainingTimeResult {
  predictedRemainingTimeMinutes: number;
  predictionRange: {
    lower: number;
    upper: number;
  };
  formattedPredictedTime: string;
  formattedRange: string;
  confidenceLevel: string;
  targetCaseId?: string;
  error?: string;
}

export interface PredictAfterInterventionResult {
  beforeBottleneck: string;
  targetStage: string;
  interventionDescription: string;
  predictedNextBottleneck: string;
  probability: number;
  stageProbabilities: Record<string, number>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  migrationDetected: boolean;
  narrative: string;
  topFactors?: TopFactorSignal[];
  error?: string;
}

export interface MLProcessPredictions {
  available: boolean;
  bottleneckForecast: BottleneckForecastResult;
  anomalyDetection: AnomalyDetectionResult;
  remainingTime: RemainingTimeResult;
  interventionForecast?: PredictAfterInterventionResult;
  serviceUrl?: string;
  error?: string;
}
