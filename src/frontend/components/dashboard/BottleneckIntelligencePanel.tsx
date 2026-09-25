"use client";

import React, { useState } from "react";
import { BottleneckCandidate, RootCauseAttribution } from "@/shared/types";
import {
  Flame,
  Hourglass,
  Clock,
  Cpu,
  AlertCircle,
  Activity,
} from "lucide-react";

interface BottleneckIntelligencePanelProps {
  dominantCandidate: BottleneckCandidate;
  selectedCandidate: BottleneckCandidate;
  rootCause?: RootCauseAttribution;
  onSelectStage: (stageName: string) => void;
  nextStageName?: string;
}

export function BottleneckIntelligencePanel({
  dominantCandidate,
  selectedCandidate,
  rootCause,
  onSelectStage,
  nextStageName,
}: BottleneckIntelligencePanelProps) {
  const isDominantSelected =
    selectedCandidate.stageName === dominantCandidate.stageName;

  const candidate = selectedCandidate;
  const metrics = candidate.stageMetrics;
  const dna = candidate.dna;

  // Selected DNA signal for interactive detail tooltip
  const [activeDnaSignal, setActiveDnaSignal] = useState<string | null>(dna.primaryFactor);

  // Calculate normalized DNA profile scores (0 to 100) for visual DNA bars
  const dnaBars = [
    {
      name: "WAITING",
      label: "Queue Waiting Delay",
      intensity: Math.min(100, Math.round(metrics.waitingContributionPct)),
      isPrimary: dna.primaryFactor === "WAITING",
      explanation: `${metrics.waitingContributionPct}% of all system queue delay occurs before this stage.`,
      active: dna.waitingHeavy,
      color: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
    },
    {
      name: "PROCESSING",
      label: "Execution Duration",
      intensity: Math.min(100, Math.round(metrics.processingContributionPct)),
      isPrimary: dna.primaryFactor === "PROCESSING",
      explanation: `${metrics.processingContributionPct}% of total active work time is consumed here.`,
      active: dna.processingHeavy,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      name: "VARIABILITY",
      label: "Duration Volatility",
      intensity: Math.min(100, Math.round((metrics.processingTimeStdDev / (metrics.avgProcessingTimeMs || 1)) * 100)),
      isPrimary: dna.primaryFactor === "VARIABILITY",
      explanation: `Duration variability with ±${Math.round(metrics.processingTimeStdDev / 1000)}s standard deviation.`,
      active: dna.highVariance,
      color: "bg-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      name: "VOLUME",
      label: "Transaction Density",
      intensity: Math.min(100, Math.round((metrics.eventCount / (metrics.uniqueCaseCount || 1)) * 50)),
      isPrimary: dna.primaryFactor === "VOLUME",
      explanation: `${metrics.eventCount} executions across ${metrics.uniqueCaseCount} process instances.`,
      active: dna.highVolume,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "RESOURCE",
      label: "Capacity Concentration",
      intensity: rootCause?.evidence.resourceWorkloadSharePct
        ? Math.min(100, Math.round(rootCause.evidence.resourceWorkloadSharePct * 2))
        : 35,
      isPrimary: dna.primaryFactor === "RESOURCE",
      explanation: `Workload concentrated among assigned operator resources.`,
      active: dna.resourceHeavy,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      name: "PEAK",
      label: "Temporal Congestion",
      intensity: rootCause?.evidence.dominantPeakHour ? 75 : 25,
      isPrimary: dna.primaryFactor === "PEAK",
      explanation: `Arrival congestion during peak operating hours (${rootCause?.evidence.dominantPeakHour || "Standard"}).`,
      active: dna.peakConcentrated,
      color: "bg-cyan-500",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl relative overflow-hidden transition-colors duration-200 space-y-6">
      {/* Top Banner: Dominant Bottleneck Showcase (Part 8) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-rose-950/20 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 flex items-center justify-center shrink-0 text-rose-500 dark:text-rose-400 shadow-inner">
              <Flame className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                  #{dominantCandidate.rank} Dominant Bottleneck
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50 font-semibold">
                  {dominantCandidate.dna.primaryFactor} Driven
                </span>
              </div>

              <div className="flex items-baseline gap-3 mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {dominantCandidate.stageName.toUpperCase()}
                </h3>
                <span className="text-3xl sm:text-4xl font-mono font-black text-rose-600 dark:text-rose-400">
                  {dominantCandidate.delayContributionScore}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  / 100 delay score
                </span>
              </div>

              {/* Deterministic "Why This Matters" statement */}
              <div className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Why this matters: </strong>
                {dominantCandidate.rationale}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {!isDominantSelected ? (
              <button
                type="button"
                onClick={() => onSelectStage(dominantCandidate.stageName)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition cursor-pointer font-mono"
              >
                Inspect {dominantCandidate.stageName}
              </button>
            ) : (
              <div className="text-right px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  ● Currently Selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-rose-200 dark:border-rose-500/20 text-xs">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800" title="Share of total observed delay occurring around this stage">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block uppercase font-bold">
              Waiting Contribution
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {dominantCandidate.stageMetrics.waitingContributionPct}%
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              Share of total observed delay
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Processing Share
            </span>
            <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono">
              {dominantCandidate.stageMetrics.processingContributionPct}%
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              active execution share
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Average Queue Lag
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {dominantCandidate.stageMetrics.formattedAvgWaitingTime}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              pre-execution stall
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
              Active Duration
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">
              {dominantCandidate.stageMetrics.formattedAvgProcessingTime}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              per case execution
            </span>
          </div>
        </div>
      </div>

      {/* Main Diagnostic Grid: Part 9 Bottleneck DNA Profile + Part 10 Root Cause Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Bottleneck DNA Visual Profile (Part 9) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  BOTTLENECK DNA PROFILE
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {candidate.stageName}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Multi-signal diagnostic vector identifying operational bottleneck properties.
            </p>

            {/* Visual DNA Horizontal Bars */}
            <div className="space-y-3">
              {dnaBars.map((bar) => {
                const isSelectedBar = activeDnaSignal === bar.name;
                return (
                  <div
                    key={bar.name}
                    onClick={() => setActiveDnaSignal(bar.name)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      bar.isPrimary
                        ? "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-sm"
                        : isSelectedBar
                        ? "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
                        : "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${bar.textColor}`}>
                          {bar.name}
                        </span>
                        {bar.isPrimary && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {bar.intensity}%
                      </span>
                    </div>

                    {/* Intensity Bar */}
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          bar.isPrimary
                            ? "bg-gradient-to-r from-rose-500 to-rose-600 shadow-sm"
                            : bar.color
                        }`}
                        style={{ width: `${Math.max(4, bar.intensity)}%` }}
                      />
                    </div>

                    {/* Short Detail Note */}
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                      {bar.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Primary Driver:</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {dna.primaryFactor} ({metrics.waitingContributionPct}% wait contribution)
            </span>
          </div>
        </div>

        {/* Right Column (7 Cols): Root Cause Evidence Cards (Part 11) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  ROOT-CAUSE EVIDENCE
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Rank #{candidate.rank} Constraint
              </span>
            </div>

            {/* Core Finding Callout */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm mb-4">
              <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">
                Deterministic Finding:
              </strong>
              {rootCause?.interpretation || candidate.rationale}
            </div>

            {/* 2x2 Evidence Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Card 1: WAITING */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Hourglass className="h-3.5 w-3.5" />
                    WAITING DELAY
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                    {metrics.waitingContributionPct}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                    {metrics.formattedAvgWaitingTime}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Largest delay contributor (pre-execution queue stall)
                  </div>
                </div>
              </div>

              {/* Card 2: RESOURCE PRESSURE */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-purple-200 dark:border-purple-900/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" />
                    RESOURCE PRESSURE
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
                    {rootCause?.evidence.resourceWorkloadSharePct ? `${rootCause.evidence.resourceWorkloadSharePct}%` : "Concentrated"}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                    {rootCause?.evidence.associatedResources && rootCause.evidence.associatedResources.length > 0
                      ? rootCause.evidence.associatedResources.slice(0, 2).join(", ")
                      : "Operator Channel Pool"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Workload duration concentrated on assigned operators
                  </div>
                </div>
              </div>

              {/* Card 3: PEAK CONCENTRATION */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-cyan-200 dark:border-cyan-900/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    PEAK CONCENTRATION
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {rootCause?.evidence.dominantPeakHour ? "Surge" : "Uniform"}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {rootCause?.evidence.dominantPeakHour || "Distributed Flow"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {rootCause?.evidence.dominantPeakHour
                      ? "Arrival delay spikes during peak window"
                      : "Arrival volume evenly distributed across hours"}
                  </div>
                </div>
              </div>

              {/* Card 4: VARIABILITY */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    VARIABILITY
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    ±{Math.round(metrics.processingTimeStdDev / 1000)}s
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {dna.highVariance ? "High Variance" : "Predictable"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {dna.highVariance
                      ? "Inconsistent stage execution duration spread"
                      : "Uniform and stable execution duration"}
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Evidence Summary */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Associated Evidence Observations:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">•</span>
                  <span>
                    <strong>Upstream Feed:</strong> Cases arrive from {rootCause?.evidence.upstreamStage || "upstream stages"} faster than {candidate.stageName} can process.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">•</span>
                  <span>
                    <strong>Queue Accumulation:</strong> Accounts for {metrics.waitingContributionPct}% of total observed process queue delay ({metrics.formattedTotalWaitingTime}).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">•</span>
                  <span>
                    <strong>Downstream Handoff:</strong> Resolving {candidate.stageName} passes cases to {nextStageName || rootCause?.evidence.downstreamStage || "next checkpoint"}.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-200 dark:border-slate-800">
            Evidence grounded in deterministic timestamp measurements without speculative causal claims.
          </p>
        </div>
      </div>
    </div>
  );
}
