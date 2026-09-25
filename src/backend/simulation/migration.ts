/**
 * FlowLens AI - Bottleneck Migration Detection Engine
 * Phase 3: What-If Simulation Engine
 */

import {
  BottleneckCandidate,
  MigrationResult,
  MigrationPattern,
} from "@/shared/types";
import { SIMULATION_LIMITS } from "./constants";

/**
 * Analyzes baseline vs simulated bottleneck rankings and classifies migration dynamics.
 */
export function detectBottleneckMigration(
  baselineBottlenecks: BottleneckCandidate[],
  simulatedBottlenecks: BottleneckCandidate[]
): MigrationResult {
  if (baselineBottlenecks.length === 0 || simulatedBottlenecks.length === 0) {
    return {
      migrated: false,
      pattern: "NO_MEANINGFUL_CHANGE",
      fromStage: "None",
      previousRank: 0,
      scoreChange: 0,
      explanationEvidence: {
        baselineTopStage: "None",
        baselineTopScore: 0,
        simulatedTopStage: "None",
        simulatedTopScore: 0,
        thresholdUsed: SIMULATION_LIMITS.MIGRATION_CONVERGENCE_THRESHOLD,
        rationale: "Insufficient stage candidate data to evaluate migration.",
      },
      narrative: "No bottleneck candidates available to evaluate simulated migration.",
    };
  }

  const baselineTop = baselineBottlenecks[0];
  const simulatedTop = simulatedBottlenecks[0];
  const fromStage = baselineTop.stageName;
  const previousRank = 1;

  // Locate where the original #1 bottleneck ranks in the simulated ranking
  const originalInSimulated = simulatedBottlenecks.find(
    (b) => b.stageName === fromStage
  );
  const newRank = originalInSimulated?.rank ?? simulatedBottlenecks.length;
  const scoreChange = originalInSimulated
    ? Math.round((originalInSimulated.delayContributionScore - baselineTop.delayContributionScore) * 10) / 10
    : 0;

  // Score difference between the top 2 stages in the simulated process
  const simulatedRunnerUp = simulatedBottlenecks[1];
  const scoreDifferenceBetweenTopTwo = simulatedRunnerUp
    ? Math.round((simulatedTop.delayContributionScore - simulatedRunnerUp.delayContributionScore) * 10) / 10
    : undefined;

  let pattern: MigrationPattern;
  let migrated = false;
  let toStage: string | undefined = undefined;
  let narrative = "";
  let rationale = "";

  // 1. Detect if the top bottleneck changed stages
  if (baselineTop.stageName !== simulatedTop.stageName) {
    migrated = true;
    toStage = simulatedTop.stageName;
    pattern = "MIGRATED_TO_ANOTHER_STAGE";
    rationale = `Target stage '${fromStage}' score decreased by ${Math.abs(scoreChange)} points (from ${baselineTop.delayContributionScore} to ${originalInSimulated?.delayContributionScore ?? 0}), dropping from Rank 1 to Rank ${newRank}. Stage '${toStage}' is now the primary simulated delay driver with score ${simulatedTop.delayContributionScore}.`;
    narrative = `Simulated bottleneck migration detected: relieving delays in '${fromStage}' shifts dominant operational delay toward '${toStage}' in this simulation scenario.`;
  } else {
    // 2. Original stage is still #1
    const absScoreChange = Math.abs(scoreChange);

    // Check for convergence with runner up
    if (
      scoreDifferenceBetweenTopTwo !== undefined &&
      scoreDifferenceBetweenTopTwo <= SIMULATION_LIMITS.MIGRATION_CONVERGENCE_THRESHOLD &&
      simulatedRunnerUp
    ) {
      pattern = "MULTIPLE_BOTTLENECK_CONVERGENCE";
      rationale = `Target stage '${fromStage}' remains Rank 1 (${simulatedTop.delayContributionScore}), but runner-up '${simulatedRunnerUp.stageName}' (${simulatedRunnerUp.delayContributionScore}) is within ${scoreDifferenceBetweenTopTwo} points, indicating emerging multi-stage delay balance.`;
      narrative = `Multiple bottlenecks converge: '${fromStage}' and '${simulatedRunnerUp.stageName}' exhibit similar delay impact under this simulated intervention.`;
    } else if (absScoreChange < SIMULATION_LIMITS.MEANINGFUL_CHANGE_THRESHOLD) {
      pattern = "NO_MEANINGFUL_CHANGE";
      rationale = `Bottleneck score change (${absScoreChange} points) is below the meaningful significance threshold of ${SIMULATION_LIMITS.MEANINGFUL_CHANGE_THRESHOLD}.`;
      narrative = `No meaningful change in process bottleneck ranking observed under this simulated intervention.`;
    } else if (absScoreChange >= SIMULATION_LIMITS.SIGNIFICANT_IMPROVEMENT_THRESHOLD) {
      pattern = "BOTTLENECK_IMPROVED_REMAINS_TOP";
      rationale = `Target stage '${fromStage}' improved by ${absScoreChange} points (from ${baselineTop.delayContributionScore} to ${simulatedTop.delayContributionScore}), but its delay contribution remains higher than all other stages.`;
      narrative = `Target stage '${fromStage}' improved by ${absScoreChange} points under simulation, but remains the primary process bottleneck.`;
    } else {
      pattern = "SAME_BOTTLENECK_REMAINS";
      rationale = `Target stage '${fromStage}' improved slightly (score: ${simulatedTop.delayContributionScore}) and retains Rank 1 status.`;
      narrative = `'${fromStage}' remains the dominant bottleneck with modest simulated improvement.`;
    }
  }

  return {
    migrated,
    pattern,
    fromStage,
    toStage,
    previousRank,
    newRank,
    scoreChange,
    scoreDifferenceBetweenTopTwo,
    explanationEvidence: {
      baselineTopStage: fromStage,
      baselineTopScore: baselineTop.delayContributionScore,
      simulatedTopStage: simulatedTop.stageName,
      simulatedTopScore: simulatedTop.delayContributionScore,
      thresholdUsed: SIMULATION_LIMITS.MIGRATION_CONVERGENCE_THRESHOLD,
      rationale,
    },
    narrative,
  };
}
