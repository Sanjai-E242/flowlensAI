"use client";

import React, { useState } from "react";
import { SimulationResult } from "@/shared/types";
import { MigrationAlert } from "./MigrationAlert";
import {
  Clock,
  Hourglass,
  Activity,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface SimulationResultsProps {
  result: SimulationResult;
  onExplainWithAiClick?: () => void;
}

export function SimulationResults({ result, onExplainWithAiClick }: SimulationResultsProps) {
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);
  const { comparison, migration, stageResults, baselineBottlenecks, simulatedBottlenecks } = result;

  return (
    <div className="space-y-6">
      {/* 1. Migration Callout Alert (Part 14) */}
      <MigrationAlert migration={migration} />

      {/* AI Explanation Callout Banner */}
      {onExplainWithAiClick && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-cyan-950/40 border border-indigo-200 dark:border-indigo-500/30 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                AI Simulation Interpretation Ready
              </span>
              <span className="text-slate-600 dark:text-slate-300 text-xs">
                Synthesize cycle-time relief and bottleneck migration into an executive summary with Gemini.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onExplainWithAiClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white font-mono shadow-md shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>Explain with AI</span>
          </button>
        </div>
      )}

      {/* 2. Executive Storytelling: BEFORE → INTERVENTION → AFTER Showcase */}
      <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50/70 via-white to-indigo-50/50 dark:from-cyan-950/30 dark:via-slate-900/70 dark:to-indigo-950/30 p-5 sm:p-6 shadow-md dark:shadow-xl">
        <div className="flex items-center justify-between border-b border-cyan-100 dark:border-cyan-900/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
              ✦ WHAT-IF TRANSFORMATION STORY
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Modeled Process Impact
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 text-xs font-mono font-bold">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>{comparison.cycleTimeReductionPercent}% Improvement</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Step 1: BEFORE */}
          <div className="rounded-xl p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                1. BEFORE INTERVENTION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Baseline
              </span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Cycle Time</div>
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
                {comparison.formattedBaselineCycleTime}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Queue Waiting:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {comparison.formattedBaselineWaitingTime}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Constraint:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                {comparison.baselineBottleneckStage} ({comparison.baselineBottleneckScore})
              </span>
            </div>
          </div>

          {/* Step 2: INTERVENTION */}
          <div className="rounded-xl p-4 bg-cyan-100/60 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-600/40 shadow-sm space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
              <span>2. INTERVENTION</span>
            </div>
            <div className="py-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {result.scenario.name}
              </div>
              <p className="text-[11px] text-cyan-800 dark:text-cyan-300/90 mt-1 font-mono">
                Targeting constraint {result.scenario.interventions[0]?.stage || comparison.baselineBottleneckStage}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-semibold shadow-xs">
              <span>Relief: -{comparison.waitingReductionPercent}% Queue Wait</span>
            </div>
          </div>

          {/* Step 3: AFTER */}
          <div className="rounded-xl p-4 bg-white dark:bg-slate-900/80 border-2 border-emerald-500/60 dark:border-emerald-500/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                3. AFTER INTERVENTION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                Simulated
              </span>
            </div>
            <div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-mono font-semibold">Simulated Cycle Time</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {comparison.formattedSimulatedCycleTime}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Queue Waiting:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {comparison.formattedSimulatedWaitingTime}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">New Constraint:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 truncate max-w-[120px]">
                {comparison.simulatedBottleneckStage} ({comparison.simulatedBottleneckScore})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cycle Time */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                Avg Case Cycle Time
              </span>
              <span className="flex items-center text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/50">
                <TrendingDown className="h-3 w-3 mr-0.5" />
                {comparison.cycleTimeReductionPercent}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono">Current</div>
                <div className="text-sm font-mono text-slate-500 line-through">
                  {comparison.formattedBaselineCycleTime}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div className="text-right">
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-mono font-bold">Simulated</div>
                <div className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-300">
                  {comparison.formattedSimulatedCycleTime}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Modeled lead time reduction
          </div>
        </div>

        {/* Queue Waiting */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Hourglass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Aggregate Queue Waiting
              </span>
              <span className="flex items-center text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/50">
                <TrendingDown className="h-3 w-3 mr-0.5" />
                {comparison.waitingReductionPercent}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono">Current</div>
                <div className="text-sm font-mono text-slate-500 line-through">
                  {comparison.formattedBaselineWaitingTime}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div className="text-right">
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-mono font-bold">Simulated</div>
                <div className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                  {comparison.formattedSimulatedWaitingTime}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-indigo-700 dark:text-indigo-300 font-mono flex items-center justify-between">
            <span>Avg/Case:</span>
            <span>{comparison.formattedBaselineAvgCaseWaiting} &rarr; {comparison.formattedSimulatedAvgCaseWaiting}</span>
          </div>
        </div>

        {/* Processing Duration */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Activity className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                Aggregate Processing
              </span>
              <span className="flex items-center text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700/50">
                <TrendingDown className="h-3 w-3 mr-0.5" />
                {comparison.processingReductionPercent}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono">Current</div>
                <div className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {comparison.formattedBaselineProcessingTime}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div className="text-right">
                <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-mono font-bold">Simulated</div>
                <div className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">
                  {comparison.formattedSimulatedProcessingTime}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-purple-700 dark:text-purple-300 font-mono flex items-center justify-between">
            <span>Avg/Case:</span>
            <span>{comparison.formattedBaselineAvgCaseProcessing} &rarr; {comparison.formattedSimulatedAvgCaseProcessing}</span>
          </div>
        </div>

        {/* Dominant Bottleneck */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                Primary Bottleneck
              </span>
              {migration.migrated && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                  Migrated
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono">Before</div>
                <div className="text-sm font-mono text-slate-500 line-through">
                  {comparison.baselineBottleneckStage} ({comparison.baselineBottleneckScore})
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <div className="text-right">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono font-bold">After</div>
                <div className="text-base font-bold font-mono text-amber-700 dark:text-amber-300">
                  {comparison.simulatedBottleneckStage} ({comparison.simulatedBottleneckScore})
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Delay score re-ranked
          </div>
        </div>
      </div>

      {/* 3. Stage-by-Stage Simulated Delay Score Comparison */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Stage Dynamics: Baseline vs. Simulated Delay Scores
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of multi-factor bottleneck contribution scores across sequential stages.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" /> Baseline
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Simulated
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {stageResults.map((s, idx) => {
            const isBaselineTop = s.stageName === baselineBottlenecks[0]?.stageName;
            const isSimulatedTop = s.stageName === simulatedBottlenecks[0]?.stageName;
            const isModified = s.waitingTimeReductionPercent > 0 || s.processingTimeReductionPercent > 0;

            return (
              <div
                key={s.stageName}
                className={`rounded-xl p-3.5 border transition relative shadow-sm ${
                  isSimulatedTop
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/50"
                    : isModified
                    ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-500/40"
                    : "bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200 truncate">
                    {idx + 1}. {s.stageName}
                  </span>
                  {isSimulatedTop && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold">
                      #1 After
                    </span>
                  )}
                  {isBaselineTop && !isSimulatedTop && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                      #1 Before
                    </span>
                  )}
                </div>

                {/* Score Comparison Bars */}
                <div className="mt-3 space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>Baseline</span>
                      <span>{s.baselineScore}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                        style={{ width: `${Math.min(100, s.baselineScore)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-cyan-600 dark:text-cyan-400 mb-0.5 font-bold">
                      <span>Simulated</span>
                      <span>{s.simulatedScore}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSimulatedTop ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${Math.min(100, s.simulatedScore)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Delta Badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Delta</span>
                  <span
                    className={`font-bold ${
                      s.scoreChange < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : s.scoreChange > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {s.scoreChange > 0 ? `+${s.scoreChange}` : s.scoreChange} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Detailed Stage-by-Stage Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider">
            Stage Comparison Breakdown
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {stageResults.length} Stages Modeled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Stage</th>
                <th className="py-2.5 px-4 font-semibold">Rank Change</th>
                <th className="py-2.5 px-4 font-semibold">Delay Score</th>
                <th className="py-2.5 px-4 font-semibold">Simulated Avg Queue</th>
                <th className="py-2.5 px-4 font-semibold">Simulated Avg Duration</th>
                <th className="py-2.5 px-4 font-semibold">Waiting Relief</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {stageResults.map((s) => (
                <tr key={s.stageName} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-200">
                    {s.stageName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-slate-400">{s.baselineRank}</span>
                    <span className="text-slate-400 mx-1">&rarr;</span>
                    <span className={s.simulatedRank === 1 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-800 dark:text-slate-200"}>
                      #{s.simulatedRank}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-slate-400">{s.baselineScore}</span>
                    <span className="text-slate-400 mx-1">&rarr;</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-300">{s.simulatedScore}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {s.formattedSimulatedAvgWaiting}
                  </td>
                  <td className="py-2.5 px-4">
                    {s.formattedSimulatedAvgProcessing}
                  </td>
                  <td className="py-2.5 px-4">
                    {s.waitingTimeReductionPercent > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        -{s.waitingTimeReductionPercent}%
                      </span>
                    ) : (
                      <span className="text-slate-400">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Simulation Assumptions Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
        <button
          type="button"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            Simulation Assumptions & Mathematical Basis
          </span>
          {showAssumptions ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {showAssumptions && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {result.assumptions.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">{a.title}: </strong>
                  {a.statement}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
