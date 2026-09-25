"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ProcessAnalysisResult,
  SimulationScenario,
  SimulationResult,
} from "@/shared/types";
import { simulateScenario } from "@/backend/simulation";
import { ScenarioControls } from "./ScenarioControls";
import { SimulationResults } from "./SimulationResults";
import { FlaskConical, RefreshCw, AlertCircle } from "lucide-react";

interface WhatIfSimulatorProps {
  analysis: ProcessAnalysisResult;
  simulationResult: SimulationResult | null;
  onSimulationChange: (result: SimulationResult | null) => void;
  onExplainWithAiClick?: () => void;
}

export function WhatIfSimulator({
  analysis,
  simulationResult,
  onSimulationChange,
  onExplainWithAiClick,
}: WhatIfSimulatorProps) {
  const dominantBottleneckStage = analysis.bottleneckCandidates[0]?.stageName || "";

  // Initial default scenario (+2 resources on dominant bottleneck for migration test)
  const defaultScenario: SimulationScenario = useMemo(() => {
    return {
      name: `Default: +2 Resources on ${dominantBottleneckStage}`,
      interventions: [
        {
          type: "RESOURCE_INCREASE",
          stage: dominantBottleneckStage,
          additionalResources: 2,
        },
      ],
    };
  }, [dominantBottleneckStage]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(
    async (scenario: SimulationScenario) => {
      setIsRunning(true);
      setError(null);

      try {
        const response = await fetch("/api/simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datasetAnalysis: analysis,
            scenario,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Simulation execution failed");
        }

        onSimulationChange(data as SimulationResult);
      } catch (err: unknown) {
        // Fallback to local deterministic execution if network failure occurs
        try {
          const localResult = simulateScenario(analysis, scenario);
          onSimulationChange(localResult);
        } catch {
          const message = err instanceof Error ? err.message : "Failed to execute simulation";
          setError(message);
        }
      } finally {
        setIsRunning(false);
      }
    },
    [analysis, onSimulationChange]
  );

  const handleResetBaseline = () => {
    runSimulation(defaultScenario);
  };

  return (
    <section className="space-y-6 pt-4 transition-colors duration-200">
      {/* Section Header (Part 12) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-500 dark:via-indigo-600 dark:to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-600/20 ring-1 ring-cyan-500/30 shrink-0">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                WHAT-IF LAB
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/60 font-semibold">
                Experiment Console
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Deterministic Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Test an intervention before changing the real process.
            </p>
          </div>
        </div>

        {simulationResult && (
          <button
            type="button"
            onClick={handleResetBaseline}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer self-start sm:self-auto font-mono"
          >
            <RefreshCw className={`h-3 w-3 ${isRunning ? "animate-spin" : ""}`} />
            Reset Baseline Scenario
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scenario Controls */}
      <ScenarioControls
        stages={analysis.stages}
        dominantBottleneckStage={dominantBottleneckStage}
        onRunSimulation={runSimulation}
        isRunning={isRunning}
        hasRun={Boolean(simulationResult)}
      />

      {/* Loading state indicator */}
      {isRunning && (
        <div className="rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50/60 dark:bg-cyan-950/40 p-8 text-center text-cyan-800 dark:text-cyan-300 font-mono text-xs flex flex-col items-center justify-center gap-2.5 animate-pulse">
          <RefreshCw className="h-6 w-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
          <span className="font-bold">Analyzing process...</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
            Re-calculating Kingman queue dynamics and bottleneck migration
          </span>
        </div>
      )}

      {/* Simulation Results Display */}
      {simulationResult && !isRunning && (
        <SimulationResults
          result={simulationResult}
          onExplainWithAiClick={onExplainWithAiClick}
        />
      )}
    </section>
  );
}
