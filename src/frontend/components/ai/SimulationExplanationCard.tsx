"use client";

import React from "react";
import { SimulationExplanation, MigrationExplanation } from "@/shared/types";
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  Shuffle,
  AlertCircle,
  Clock,
  Hourglass,
  Layers,
} from "lucide-react";

interface SimulationExplanationCardProps {
  simulationExplanation: SimulationExplanation;
  migrationExplanation?: MigrationExplanation;
}

export function SimulationExplanationCard({
  simulationExplanation,
  migrationExplanation,
}: SimulationExplanationCardProps) {
  const { headline, narrative, baselineVsSimulated, isSimulatedNotice } =
    simulationExplanation;

  return (
    <div className="rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50/50 via-white to-slate-50 dark:from-slate-900/90 dark:via-cyan-950/20 dark:to-slate-950/80 p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors duration-200">
      {/* Top Banner & Labeling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/15 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-300 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
                AI-Generated Explanation
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold">
                Simulation Narrative
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{headline}</h3>
          </div>
        </div>

        <div className="text-[11px] font-mono text-cyan-800 dark:text-cyan-400 self-start sm:self-auto bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-200 dark:border-cyan-800/40 font-semibold">
          Intervention: {simulationExplanation.modeledIntervention}
        </div>
      </div>

      {/* Side-by-side: Observed vs Simulated KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Cycle Time */}
        <div className="rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
              <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" /> Cycle Time
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              {baselineVsSimulated.cycleTime.reductionPct}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">Observed</div>
              <div className="text-slate-500 line-through">
                {baselineVsSimulated.cycleTime.baseline}
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <div className="text-right">
              <div className="text-[9px] text-cyan-600 dark:text-cyan-400 uppercase font-bold">Simulated</div>
              <div className="text-cyan-700 dark:text-cyan-300 font-bold">
                {baselineVsSimulated.cycleTime.simulated}
              </div>
            </div>
          </div>
        </div>

        {/* Queue Waiting */}
        <div className="rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
              <Hourglass className="h-3 w-3 text-indigo-600 dark:text-indigo-400" /> Queue Waiting
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              {baselineVsSimulated.waitingTime.reductionPct}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">Observed</div>
              <div className="text-slate-500 line-through">
                {baselineVsSimulated.waitingTime.baseline}
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <div className="text-right">
              <div className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold">Simulated</div>
              <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                {baselineVsSimulated.waitingTime.simulated}
              </div>
            </div>
          </div>
        </div>

        {/* Processing Duration */}
        <div className="rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
              <Layers className="h-3 w-3 text-violet-600 dark:text-violet-400" /> Active Work
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
              {baselineVsSimulated.processingTime.reductionPct > 0
                ? `-${baselineVsSimulated.processingTime.reductionPct}%`
                : "Unchanged"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">Observed</div>
              <div className="text-slate-600 dark:text-slate-400">
                {baselineVsSimulated.processingTime.baseline}
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <div className="text-right">
              <div className="text-[9px] text-violet-600 dark:text-violet-400 uppercase font-bold">Simulated</div>
              <div className="text-violet-700 dark:text-violet-300 font-bold">
                {baselineVsSimulated.processingTime.simulated}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Natural Language Simulation Narrative */}
      <div className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3.5 mb-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200 shadow-sm">
        <div className="text-[10px] font-mono uppercase text-cyan-700 dark:text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
          Modeled Outcome Interpretation
        </div>
        <p className="whitespace-pre-line font-medium">{narrative}</p>
      </div>

      {/* Simulated Bottleneck Migration Section */}
      {migrationExplanation && (
        <div
          className={`rounded-lg p-3.5 mb-3 border text-xs leading-relaxed shadow-sm ${
            migrationExplanation.detected
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200"
              : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Shuffle
              className={`h-3.5 w-3.5 ${
                migrationExplanation.detected ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
              }`}
            />
            <span className="font-mono font-bold text-[10px] uppercase tracking-wider">
              {migrationExplanation.detected
                ? "Simulated Bottleneck Migration Detected"
                : "Constraint Stability"}
            </span>
            {migrationExplanation.detected && migrationExplanation.toStage && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold">
                {migrationExplanation.fromStage} → {migrationExplanation.toStage}
              </span>
            )}
          </div>
          <p className="text-[11.5px] leading-relaxed font-medium">
            {migrationExplanation.narrative}
          </p>
          <p className="mt-1.5 text-[10.5px] text-amber-700 dark:text-amber-300/80 italic font-mono">
            {migrationExplanation.caveat}
          </p>
        </div>
      )}

      {/* Theoretical Disclaimer */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
        <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span>{isSimulatedNotice}</span>
      </div>
    </div>
  );
}
