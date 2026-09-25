"use client";

import React from "react";
import { BottleneckCandidate, StageMetrics } from "@/shared/types";
import { BarChart3, Clock, Hourglass } from "lucide-react";

interface StageComparisonChartProps {
  stages: StageMetrics[];
  bottlenecks: BottleneckCandidate[];
  selectedStageName: string;
  onSelectStage: (stageName: string) => void;
}

export function StageComparisonChart({
  stages,
  bottlenecks,
  selectedStageName,
  onSelectStage,
}: StageComparisonChartProps) {
  const bottleneckMap = new Map<string, BottleneckCandidate>();
  bottlenecks.forEach((b) => bottleneckMap.set(b.stageName, b));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Stage Delay Distribution: Processing vs. Waiting
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compares active work duration against inter-stage queue delays across all process stages.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-cyan-600 dark:bg-cyan-500" />
            <span className="text-slate-700 dark:text-slate-300">Processing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300">Queue Waiting</span>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Rows */}
      <div className="space-y-3.5">
        {stages.map((stage) => {
          const candidate = bottleneckMap.get(stage.stageName);
          const isSelected = selectedStageName === stage.stageName;
          const isDominant = candidate?.rank === 1;

          return (
            <div
              key={stage.stageName}
              onClick={() => onSelectStage(stage.stageName)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-50 dark:bg-slate-900 border-cyan-500 shadow-sm ring-1 ring-cyan-500/40"
                  : isDominant
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40 hover:border-rose-400 dark:hover:border-rose-700"
                  : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {stage.stageName}
                  </span>
                  {candidate && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        isDominant
                          ? "bg-rose-500 text-white font-bold"
                          : candidate.rank === 2
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Rank #{candidate.rank} (Score: {candidate.delayContributionScore})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400" title="Processing Time">
                    <Clock className="h-3 w-3" />
                    {stage.formattedAvgProcessingTime}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title="Waiting Time">
                    <Hourglass className="h-3 w-3" />
                    {stage.formattedAvgWaitingTime}
                  </span>
                </div>
              </div>

              {/* Progress Bar Bars */}
              <div className="space-y-1.5">
                {/* Processing bar */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    Proc: {stage.processingContributionPct}%
                  </span>
                  <div className="h-2.5 flex-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(1, stage.processingContributionPct)}%` }}
                    />
                  </div>
                  <span className="w-24 text-[10px] font-mono text-slate-500 dark:text-slate-400 text-right shrink-0">
                    {stage.formattedTotalProcessingTime}
                  </span>
                </div>

                {/* Waiting bar */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    Wait: {stage.waitingContributionPct}%
                  </span>
                  <div className="h-2.5 flex-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(1, stage.waitingContributionPct)}%` }}
                    />
                  </div>
                  <span className="w-24 text-[10px] font-mono text-slate-500 dark:text-slate-400 text-right shrink-0">
                    {stage.formattedTotalWaitingTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
