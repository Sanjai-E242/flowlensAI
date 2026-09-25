"use client";

import React, { useMemo } from "react";
import { BottleneckCandidate, StageMetrics, StageTransition } from "@/shared/types";
import {
  AlertTriangle,
  Flame,
  Clock,
  Hourglass,
  Layers,
} from "lucide-react";

interface ProcessFlowGraphProps {
  stages: StageMetrics[];
  bottlenecks: BottleneckCandidate[];
  transitions: StageTransition[];
  selectedStageName: string;
  onSelectStage: (stageName: string) => void;
  caseSequences?: string[][];
}

export function ProcessFlowGraph({
  stages,
  bottlenecks,
  transitions,
  selectedStageName,
  onSelectStage,
  caseSequences,
}: ProcessFlowGraphProps) {
  const bottleneckMap = useMemo(() => {
    const map = new Map<string, BottleneckCandidate>();
    bottlenecks.forEach((b) => map.set(b.stageName, b));
    return map;
  }, [bottlenecks]);

  const transitionMap = useMemo(() => {
    const map = new Map<string, StageTransition>();
    transitions.forEach((t) => {
      map.set(`${t.fromStage}->${t.toStage}`, t);
    });
    return map;
  }, [transitions]);

  // Chronologically ordered stages based on case sequences or transition flow
  const sortedStages = useMemo(() => {
    if (stages.length <= 1) return stages;

    // Calculate average index in case sequences if available
    if (caseSequences && caseSequences.length > 0) {
      const stageIndexSum = new Map<string, { total: number; count: number }>();
      caseSequences.forEach((seq) => {
        seq.forEach((st, idx) => {
          const cur = stageIndexSum.get(st) || { total: 0, count: 0 };
          stageIndexSum.set(st, { total: cur.total + idx, count: cur.count + 1 });
        });
      });

      return [...stages].sort((a, b) => {
        const avgA = stageIndexSum.has(a.stageName)
          ? stageIndexSum.get(a.stageName)!.total / stageIndexSum.get(a.stageName)!.count
          : 0;
        const avgB = stageIndexSum.has(b.stageName)
          ? stageIndexSum.get(b.stageName)!.total / stageIndexSum.get(b.stageName)!.count
          : 0;
        return avgA - avgB;
      });
    }

    // Fallback: derive order from transitions directed graph
    const incomingCount = new Map<string, number>();
    stages.forEach((s) => incomingCount.set(s.stageName, 0));
    transitions.forEach((t) => {
      incomingCount.set(t.toStage, (incomingCount.get(t.toStage) || 0) + 1);
    });

    // Start with stage having fewest incoming transitions
    return [...stages].sort((a, b) => {
      const incA = incomingCount.get(a.stageName) || 0;
      const incB = incomingCount.get(b.stageName) || 0;
      return incA - incB;
    });
  }, [stages, caseSequences, transitions]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl relative overflow-hidden transition-colors duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Process Flow Topology
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              Interactive Map
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconstructed chronological topology. Click any stage node to inspect root causes and delay evidence.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Dominant Bottleneck
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-600 dark:text-amber-300 font-medium">
              Secondary Delay
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span>Standard Flow</span>
          </div>
        </div>
      </div>

      {/* Horizontal Topology Container */}
      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
        <div className="inline-flex items-center min-w-full justify-start lg:justify-center gap-1.5 sm:gap-2">
          {sortedStages.map((stage, idx) => {
            const candidate = bottleneckMap.get(stage.stageName);
            const isRank1 = candidate?.rank === 1;
            const isRank2 = candidate?.rank === 2;
            const isSelected = selectedStageName === stage.stageName;

            // Transition following this stage in sorted sequence
            const nextStage = sortedStages[idx + 1];
            const outgoingTransition = nextStage
              ? transitionMap.get(`${stage.stageName}->${nextStage.stageName}`)
              : undefined;

            const isNextDominant = nextStage
              ? bottleneckMap.get(nextStage.stageName)?.rank === 1
              : false;

            const hasHeavyQueueNext =
              outgoingTransition && outgoingTransition.avgWaitTimeMs > 600000;

            return (
              <React.Fragment key={stage.stageName}>
                {/* Stage Node */}
                <button
                  type="button"
                  onClick={() => onSelectStage(stage.stageName)}
                  className={`relative text-left rounded-xl p-4 transition-all duration-200 shrink-0 w-52 sm:w-56 cursor-pointer select-none border transform hover:-translate-y-0.5 ${
                    isSelected
                      ? "ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-lg z-20"
                      : "hover:shadow-md"
                  } ${
                    isRank1
                      ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500/80 shadow-rose-500/20 dark:shadow-rose-950/40 bottleneck-beacon"
                      : isRank2
                      ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/50"
                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Status Ribbon / Rank */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    {isRank1 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                        <Flame className="h-3 w-3" />
                        #1 BOTTLENECK
                      </span>
                    ) : isRank2 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        STAGE #{candidate?.rank}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        STAGE {idx + 1}
                      </span>
                    )}

                    {candidate && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          isRank1
                            ? "text-rose-600 dark:text-rose-400"
                            : isRank2
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                        title="Bottleneck Delay Contribution Score (0-100)"
                      >
                        Score: {candidate.delayContributionScore}
                      </span>
                    )}
                  </div>

                  {/* Stage Name */}
                  <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {stage.stageName}
                  </div>

                  {/* Metrics preview */}
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        Processing:
                      </span>
                      <span className="font-mono font-medium">
                        {stage.formattedAvgProcessingTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Hourglass className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                        Queue Wait:
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          stage.waitingContributionPct > 50
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {stage.formattedAvgWaitingTime}
                      </span>
                    </div>
                  </div>

                  {/* Bottleneck DNA Tag */}
                  {candidate && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          candidate.dna.primaryFactor === "WAITING"
                            ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60"
                            : candidate.dna.primaryFactor === "PROCESSING"
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                            : candidate.dna.primaryFactor === "RESOURCE"
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60"
                            : candidate.dna.primaryFactor === "PEAK"
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/60"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {candidate.dna.primaryFactor}
                      </span>

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {candidate.dna.tags[0] || "Standard"}
                      </span>
                    </div>
                  )}
                </button>

                {/* Transition Flow Arrow */}
                {outgoingTransition && (
                  <div className="flex flex-col items-center justify-center px-1 shrink-0 relative group">
                    {/* Waiting time badge */}
                    <div
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap mb-1 transition-all ${
                        isNextDominant || hasHeavyQueueNext
                          ? "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 font-bold shadow-sm"
                          : "bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      {outgoingTransition.formattedAvgWaitTime} queue
                    </div>

                    {/* SVG Transition Arrow with Particle Stream */}
                    <svg
                      width="54"
                      height="20"
                      className="overflow-visible"
                      aria-hidden="true"
                    >
                      <defs>
                        <marker
                          id={`arrow-${idx}`}
                          viewBox="0 0 10 10"
                          refX="7"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path
                            d="M 0 1.5 L 8 5 L 0 8.5 z"
                            fill={isNextDominant ? "#f43f5e" : "#0284c7"}
                          />
                        </marker>
                      </defs>

                      {/* Base Line */}
                      <line
                        x1="2"
                        y1="10"
                        x2="48"
                        y2="10"
                        stroke={isNextDominant ? "#fecdd3" : "#cbd5e1"}
                        className="dark:stroke-slate-800"
                        strokeWidth="2.5"
                      />

                      {/* Animated Particle Stream Line */}
                      <line
                        x1="2"
                        y1="10"
                        x2="48"
                        y2="10"
                        stroke={isNextDominant ? "#f43f5e" : "#0284c7"}
                        strokeWidth="2"
                        markerEnd={`url(#arrow-${idx})`}
                        className={
                          isNextDominant
                            ? "flow-bottleneck-line"
                            : "flow-active-line"
                        }
                      />
                    </svg>

                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {outgoingTransition.transitionCount} cases
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
