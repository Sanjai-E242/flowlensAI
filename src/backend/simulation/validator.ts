/**
 * FlowLens AI - Simulation Scenario Validation
 * Phase 3: What-If Simulation Engine
 */

import {
  SimulationScenario,
  SimulationValidationError,
  ProcessAnalysisResult,
  Intervention,
} from "@/shared/types";
import { SIMULATION_LIMITS } from "./constants";

export interface ScenarioValidationResult {
  isValid: boolean;
  errors: SimulationValidationError[];
}

/**
 * Validates a simulation scenario against a process analysis baseline.
 */
export function validateSimulationScenario(
  scenario: SimulationScenario,
  processAnalysis: ProcessAnalysisResult
): ScenarioValidationResult {
  const errors: SimulationValidationError[] = [];

  if (!scenario || typeof scenario !== "object") {
    errors.push({
      field: "scenario",
      message: "Simulation scenario payload is required and must be an object.",
      code: "INVALID_PAYLOAD",
    });
    return { isValid: false, errors };
  }

  if (!Array.isArray(scenario.interventions) || scenario.interventions.length === 0) {
    errors.push({
      field: "interventions",
      message: "At least one valid intervention must be provided in the scenario.",
      code: "EMPTY_SCENARIO",
    });
    return { isValid: false, errors };
  }

  const validStageNames = new Set(
    (processAnalysis?.stages ?? []).map((s) => s.stageName)
  );

  scenario.interventions.forEach((intervention: Intervention, index: number) => {
    const fieldPrefix = `interventions[${index}]`;

    if (!intervention || typeof intervention !== "object") {
      errors.push({
        field: fieldPrefix,
        message: `Intervention at index ${index} must be a valid object.`,
        code: "INVALID_PAYLOAD",
      });
      return;
    }

    // 1. Stage validation
    if (!intervention.stage || typeof intervention.stage !== "string") {
      errors.push({
        field: `${fieldPrefix}.stage`,
        message: `Intervention at index ${index} is missing a valid target stage name.`,
        code: "STAGE_NOT_FOUND",
      });
    } else if (!validStageNames.has(intervention.stage)) {
      errors.push({
        field: `${fieldPrefix}.stage`,
        message: `Target stage '${intervention.stage}' does not exist in the analyzed process. Available stages: ${Array.from(validStageNames).join(", ")}.`,
        code: "STAGE_NOT_FOUND",
      });
    }

    // 2. Type and Parameter validation
    switch (intervention.type) {
      case "RESOURCE_INCREASE": {
        const count = intervention.additionalResources;
        if (
          typeof count !== "number" ||
          !Number.isInteger(count) ||
          count < SIMULATION_LIMITS.MIN_ADDITIONAL_RESOURCES ||
          count > SIMULATION_LIMITS.MAX_ADDITIONAL_RESOURCES
        ) {
          errors.push({
            field: `${fieldPrefix}.additionalResources`,
            message: `additionalResources must be an integer between ${SIMULATION_LIMITS.MIN_ADDITIONAL_RESOURCES} and ${SIMULATION_LIMITS.MAX_ADDITIONAL_RESOURCES}. Received: ${count}.`,
            code: "INVALID_ADDITIONAL_RESOURCES",
          });
        }
        break;
      }

      case "PROCESSING_TIME_REDUCTION": {
        const pct = intervention.reductionPercent;
        if (
          typeof pct !== "number" ||
          isNaN(pct) ||
          pct < SIMULATION_LIMITS.MIN_REDUCTION_PERCENT ||
          pct > SIMULATION_LIMITS.MAX_REDUCTION_PERCENT
        ) {
          errors.push({
            field: `${fieldPrefix}.reductionPercent`,
            message: `reductionPercent must be a number between ${SIMULATION_LIMITS.MIN_REDUCTION_PERCENT}% and ${SIMULATION_LIMITS.MAX_REDUCTION_PERCENT}%. Received: ${pct}.`,
            code: "INVALID_REDUCTION_PERCENT",
          });
        }
        break;
      }

      case "QUEUE_REDUCTION": {
        const pct = intervention.reductionPercent;
        if (
          typeof pct !== "number" ||
          isNaN(pct) ||
          pct < SIMULATION_LIMITS.MIN_REDUCTION_PERCENT ||
          pct > SIMULATION_LIMITS.MAX_REDUCTION_PERCENT
        ) {
          errors.push({
            field: `${fieldPrefix}.reductionPercent`,
            message: `reductionPercent must be a number between ${SIMULATION_LIMITS.MIN_REDUCTION_PERCENT}% and ${SIMULATION_LIMITS.MAX_REDUCTION_PERCENT}%. Received: ${pct}.`,
            code: "INVALID_REDUCTION_PERCENT",
          });
        }
        break;
      }

      default: {
        errors.push({
          field: `${fieldPrefix}.type`,
          message: `Unrecognized intervention type '${(intervention as { type?: string }).type}'. Supported types: RESOURCE_INCREASE, PROCESSING_TIME_REDUCTION, QUEUE_REDUCTION.`,
          code: "INVALID_INTERVENTION_TYPE",
        });
        break;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
