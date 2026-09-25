"use client";

import React from "react";
import { BottleneckCandidate, StageMetrics } from "@/shared/types";
import { Layers, Flame, ArrowRight } from "lucide-react";

interface ProcessStageTableProps {
  stages: StageMetrics[];
  bottlenecks: BottleneckCandidate[];
  selectedStageName: string;
  onSelectStage: (stageName: string) => void;
}

export function ProcessStageTable({
  stages,
  bottlenecks,
  selectedStageName,
  onSelectStage,
}: ProcessStageTableProps) {
  // Map candidates by stageName for instant lookup
  const candidateMap = new Map<string, BottleneckCandidate>();
  bottlenecks.forEach((b) => candidateMap.set(b.stageName, b));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Table Header / Title */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Process Stage Performance Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative lead-time consumption, queue waiting, and operational volatility across all {stages.length} workflow stages.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold tracking-wider uppercase">
              <th className="py-3 px-4">Stage Name</th>
              <th className="py-3 px-3 text-center">Delay Rank & Score</th>
              <th className="py-3 px-3 text-right">Avg Processing</th>
              <th className="py-3 px-3 text-right">Avg Waiting</th>
              <th className="py-3 px-3 text-center">Volume Share</th>
              <th className="py-3 px-3 text-center">Variability</th>
              <th className="py-3 px-3 text-center">Resource Pressure</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {stages.map((stage) => {
              const candidate = candidateMap.get(stage.stageName);
              const isSelected = stage.stageName === selectedStageName;
              const isDominant = candidate?.rank === 1;

              // Qualitative indicators
              const volumeLevel =
                stage.eventCount >= (stages.reduce((acc, s) => acc + s.eventCount, 0) / stages.length) * 1.2
                  ? "High"
                  : stage.eventCount <= (stages.reduce((acc, s) => acc + s.eventCount, 0) / stages.length) * 0.7
                  ? "Low"
                  : "Medium";

              const variabilityLevel = candidate?.dna.highVariance
                ? "High"
                : stage.processingTimeStdDev > stage.avgProcessingTimeMs * 0.3
                ? "Medium"
                : "Low";

              const resourceLevel = candidate?.dna.resourceHeavy
                ? "High"
                : "Normal";

              return (
                <tr
                  key={stage.stageName}
                  onClick={() => onSelectStage(stage.stageName)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-indigo-50/70 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/30"
                      : isDominant
                      ? "bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Stage Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isDominant && (
                        <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {stage.stageName.replace(/_/g, " ")}
                      </span>
                      {isDominant && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          TOP BOTTLENECK
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Delay Rank & Score */}
                  <td className="py-3 px-3 text-center">
                    {candidate ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <span className="text-[10px] text-slate-500">#{candidate.rank}</span>
                        <span className={isDominant ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                          {candidate.delayContributionScore.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Processing Duration & % */}
                  <td className="py-3 px-3 text-right">
                    <div className="text-slate-900 dark:text-slate-200 font-mono">
                      {stage.formattedAvgProcessingTime}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {stage.processingContributionPct.toFixed(1)}% of total
                    </div>
                  </td>

                  {/* Waiting Duration & % */}
                  <td className="py-3 px-3 text-right">
                    <div
                      className={`font-mono ${
                        stage.waitingContributionPct > 30
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {stage.formattedAvgWaitingTime}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {stage.waitingContributionPct.toFixed(1)}% of total
                    </div>
                  </td>

                  {/* Volume Share */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        volumeLevel === "High"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : volumeLevel === "Medium"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {volumeLevel} ({stage.eventCount})
                    </span>
                  </td>

                  {/* Variability */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        variabilityLevel === "High"
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                          : variabilityLevel === "Medium"
                          ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {variabilityLevel}
                    </span>
                  </td>

                  {/* Resource Pressure */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        resourceLevel === "High"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {resourceLevel}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStage(stage.stageName);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
