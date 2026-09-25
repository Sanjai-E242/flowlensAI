"use client";

import React, { useEffect, useState } from "react";
import { ProcessMetrics, DatasetSummary, ProcessDomainInfo } from "@/shared/types";
import {
  Clock,
  Zap,
  Layers,
  FileSpreadsheet,
  Hourglass,
  Tag,
} from "lucide-react";

interface ProcessOverviewCardsProps {
  metrics: ProcessMetrics;
  datasetSummary?: DatasetSummary;
  domainInfo?: ProcessDomainInfo;
}

/**
 * Animated number counter component
 */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const end = value;
    const startTime = performance.now();
    let animId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(end * ease));

      if (progress < 1) {
        animId = requestAnimationFrame(updateCounter);
      }
    };

    animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{current.toLocaleString()}</span>;
}

export function ProcessOverviewCards({
  metrics,
  datasetSummary,
  domainInfo,
}: ProcessOverviewCardsProps) {
  const caseLabel = domainInfo?.terminology.caseLabelPlural || "Cases";
  const domainName = domainInfo?.domain || datasetSummary?.domain || "General Operations";

  const kpiCards = [
    {
      label: `Total ${caseLabel}`,
      numericValue: metrics.totalCases,
      isNumeric: true,
      subtext: "Reconstructed instances",
      icon: Layers,
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-50/60 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-800/40",
    },
    {
      label: "Total Events",
      numericValue: metrics.totalEvents,
      isNumeric: true,
      subtext: `${metrics.uniqueStagesCount} process stages`,
      icon: FileSpreadsheet,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50/60 dark:bg-cyan-950/40",
      borderColor: "border-cyan-200 dark:border-cyan-800/40",
    },
    {
      label: "Avg Cycle Time",
      formattedValue: metrics.formattedAvgCycleTime,
      isNumeric: false,
      subtext: `Min ${Math.round(metrics.minCaseCycleTimeMs / 60000)}m · Max ${Math.round(metrics.maxCaseCycleTimeMs / 60000)}m`,
      icon: Clock,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50/60 dark:bg-indigo-950/40",
      borderColor: "border-indigo-200 dark:border-indigo-800/40",
    },
    {
      label: "Avg Waiting Time",
      formattedValue: metrics.formattedAvgWaitingTime,
      isNumeric: false,
      subtext: "Non-value-add queue friction",
      icon: Hourglass,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50/60 dark:bg-rose-950/40",
      borderColor: "border-rose-200 dark:border-rose-800/40",
    },
    {
      label: "Process Efficiency",
      numericValue: Math.round(metrics.avgProcessEfficiencyPct),
      suffix: "%",
      isNumeric: true,
      subtext: `${(100 - metrics.avgProcessEfficiencyPct).toFixed(1)}% queue friction`,
      icon: Zap,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50/60 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-800/40",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hero Header (Part 6 & 21) */}
      <div className="py-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 mb-2">
            <Tag className="h-3 w-3 text-indigo-500" />
            <span>Process Domain:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{domainName}</strong>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Where does your process actually slow down?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            FlowLens AI transforms event data into bottleneck intelligence, root-cause evidence, and actionable what-if simulations across any industry.
          </p>
        </div>

        {/* Dataset Quick Meta Pill */}
        {datasetSummary && (
          <div className="shrink-0 text-right hidden sm:block">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block">
              RECONSTRUCTED DATASET
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs block">
              {datasetSummary.name}
            </span>
          </div>
        )}
      </div>

      {/* 5 Compact Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 sm:p-4 rounded-xl border ${card.borderColor} ${card.bgColor} bg-white dark:${card.bgColor} shadow-sm backdrop-blur-sm flex flex-col justify-between transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.color} shrink-0`} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {card.isNumeric ? (
                    <>
                      <AnimatedNumber value={card.numericValue!} />
                      {card.suffix || ""}
                    </>
                  ) : (
                    card.formattedValue
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Context Pill Row: Processing vs Waiting Breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-xs font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Avg Active Work:</span>
            <strong className="text-slate-900 dark:text-slate-200">
              {metrics.formattedAvgProcessingTime}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Avg Queue Delay:</span>
            <strong className="text-slate-900 dark:text-slate-200">
              {metrics.formattedAvgWaitingTime}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>
            Total Processing: {metrics.formattedTotalProcessingTime}
          </span>
          <span>•</span>
          <span>
            Total Waiting: {metrics.formattedTotalWaitingTime}
          </span>
        </div>
      </div>
    </div>
  );
}
