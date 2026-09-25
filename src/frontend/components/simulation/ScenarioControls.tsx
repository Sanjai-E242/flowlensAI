"use client";

import React, { useState } from "react";
import {
  StageMetrics,
  Intervention,
  InterventionType,
  SimulationScenario,
} from "@/shared/types";
import { Play, Sparkles, Users, Clock, Hourglass, Layers, CheckCircle2 } from "lucide-react";

interface ScenarioControlsProps {
  stages: StageMetrics[];
  dominantBottleneckStage: string;
  onRunSimulation: (scenario: SimulationScenario) => void;
  isRunning: boolean;
  hasRun?: boolean;
}

export function ScenarioControls({
  stages,
  dominantBottleneckStage,
  onRunSimulation,
  isRunning,
  hasRun = false,
}: ScenarioControlsProps) {
  const [selectedStage, setSelectedStage] = useState<string>(
    dominantBottleneckStage || stages[0]?.stageName || ""
  );
  const [interventionType, setInterventionType] = useState<InterventionType>(
    "RESOURCE_INCREASE"
  );
  const [additionalResources, setAdditionalResources] = useState<number>(2);
  const [reductionPercent, setReductionPercent] = useState<number>(30);

  const handleRun = () => {
    let intervention: Intervention;

    if (interventionType === "RESOURCE_INCREASE") {
      intervention = {
        type: "RESOURCE_INCREASE",
        stage: selectedStage,
        additionalResources: Number(additionalResources),
      };
    } else if (interventionType === "PROCESSING_TIME_REDUCTION") {
      intervention = {
        type: "PROCESSING_TIME_REDUCTION",
        stage: selectedStage,
        reductionPercent: Number(reductionPercent),
      };
    } else {
      intervention = {
        type: "QUEUE_REDUCTION",
        stage: selectedStage,
        reductionPercent: Number(reductionPercent),
      };
    }

    onRunSimulation({
      name: `Custom Intervention: ${selectedStage}`,
      interventions: [intervention],
    });
  };

  const handleApplyPreset = (
    stage: string,
    type: InterventionType,
    val: number
  ) => {
    setSelectedStage(stage);
    setInterventionType(type);
    if (type === "RESOURCE_INCREASE") {
      setAdditionalResources(val);
      onRunSimulation({
        name: `Preset: ${stage} +${val} Resource(s)`,
        interventions: [
          {
            type: "RESOURCE_INCREASE",
            stage,
            additionalResources: val,
          },
        ],
      });
    } else {
      setReductionPercent(val);
      onRunSimulation({
        name: `Preset: ${stage} -${val}% ${type === "QUEUE_REDUCTION" ? "Queue" : "Processing"}`,
        interventions: [
          {
            type,
            stage,
            reductionPercent: val,
          },
        ],
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-5 transition-colors duration-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            Intervention Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a target stage, define an operational intervention, and observe simulated system dynamics.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-500" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset(dominantBottleneckStage, "RESOURCE_INCREASE", 1)}
            disabled={isRunning}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer disabled:opacity-50 font-mono font-medium"
          >
            +1 Resource
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(dominantBottleneckStage, "RESOURCE_INCREASE", 2)}
            disabled={isRunning}
            className="text-[11px] px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition cursor-pointer disabled:opacity-50 font-mono font-bold"
          >
            +2 Resources (Migration Test)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(dominantBottleneckStage, "QUEUE_REDUCTION", 50)}
            disabled={isRunning}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer disabled:opacity-50 font-mono font-medium"
          >
            -50% Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Target Stage */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Target Process Stage</span>
            {selectedStage === dominantBottleneckStage && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold">#1 Bottleneck</span>
            )}
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium cursor-pointer"
          >
            {stages.map((s) => (
              <option key={s.stageName} value={s.stageName}>
                {s.stageName} {s.stageName === dominantBottleneckStage ? "(Dominant Bottleneck)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Intervention Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Intervention Model
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setInterventionType("RESOURCE_INCREASE")}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium transition cursor-pointer ${
                interventionType === "RESOURCE_INCREASE"
                  ? "bg-cyan-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Users className="h-3 w-3" />
              Resources
            </button>
            <button
              type="button"
              onClick={() => setInterventionType("QUEUE_REDUCTION")}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium transition cursor-pointer ${
                interventionType === "QUEUE_REDUCTION"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Hourglass className="h-3 w-3" />
              Queue
            </button>
            <button
              type="button"
              onClick={() => setInterventionType("PROCESSING_TIME_REDUCTION")}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium transition cursor-pointer ${
                interventionType === "PROCESSING_TIME_REDUCTION"
                  ? "bg-purple-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="h-3 w-3" />
              Duration
            </button>
          </div>
        </div>

        {/* 3. Parameter Input */}
        <div className="space-y-1.5">
          {interventionType === "RESOURCE_INCREASE" ? (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Additional Resources
                </label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  +{additionalResources} Headcount
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdditionalResources(val)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                      additionalResources === val
                        ? "bg-cyan-50 dark:bg-cyan-950 border border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {interventionType === "QUEUE_REDUCTION" ? "Queue Reduction" : "Duration Reduction"}
                </label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  -{reductionPercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={reductionPercent}
                onChange={(e) => setReductionPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-500 mt-2"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>5%</span>
                <span>30%</span>
                <span>60%</span>
                <span>90%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Execution Action Button (Part 12) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
          {hasRun && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Simulation active</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !selectedStage}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/25 transition cursor-pointer disabled:opacity-50 font-mono tracking-wide"
        >
          {isRunning ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>SIMULATING INTERVENTION...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>RUN SIMULATION</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
