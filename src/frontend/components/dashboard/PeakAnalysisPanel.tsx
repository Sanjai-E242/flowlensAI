"use client";

import React from "react";
import { PeakAnalysisResult } from "@/shared/types";
import { Clock, TrendingUp } from "lucide-react";

interface PeakAnalysisPanelProps {
  peakAnalysis: PeakAnalysisResult;
}

export function PeakAnalysisPanel({ peakAnalysis }: PeakAnalysisPanelProps) {
  const maxVolume = Math.max(
    1,
    ...peakAnalysis.hourlyBuckets.map((b) => b.eventVolume)
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Temporal Dynamics & Peak Traffic Intelligence
            </h3>
            {peakAnalysis.peakHours.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                {peakAnalysis.peakHours.length} Peak Windows Detected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic time-bucket analysis evaluating hourly volume surges (&ge;120% of mean threshold).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-blue-600 dark:bg-blue-500" />
            <span className="text-slate-700 dark:text-slate-300">Peak Window (&ge;1.2x Avg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-300 dark:bg-slate-700" />
            <span className="text-slate-500 dark:text-slate-400">Standard Volume</span>
          </div>
        </div>
      </div>

      {/* Metric-Grounded Summary Text */}
      <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-slate-800 dark:text-slate-200 mb-6 flex items-start gap-2.5">
        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-blue-700 dark:text-blue-300">Temporal Association: </span>
          {peakAnalysis.summaryText}
        </p>
      </div>

      {/* 24-Hour Distribution Histogram */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-24 gap-1 h-36 items-end border-b border-slate-200 dark:border-slate-800 pb-2">
            {peakAnalysis.hourlyBuckets.map((bucket) => {
              const heightPct = Math.round((bucket.eventVolume / maxVolume) * 100);
              return (
                <div
                  key={bucket.hour}
                  className="flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full mb-2 z-30 p-2.5 rounded-lg bg-slate-900 text-white border border-slate-700 shadow-xl text-[10px] font-mono whitespace-nowrap">
                    <p className="font-bold text-white">{bucket.hourLabel}</p>
                    <p>Events: {bucket.eventVolume}</p>
                    <p>Case Arrivals: {bucket.caseArrivals}</p>
                    <p>Avg Wait: {bucket.formattedAvgWaiting}</p>
                    <p>Avg Exec: {bucket.formattedAvgProcessing}</p>
                    {bucket.isPeak && (
                      <span className="text-blue-400 font-bold block mt-1">
                        Peak Window ({bucket.volumeRatioToAvg}x Avg)
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      bucket.isPeak
                        ? "bg-gradient-to-t from-blue-600 to-cyan-500 shadow-sm shadow-blue-500/30"
                        : bucket.eventVolume > 0
                        ? "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                        : "bg-slate-100 dark:bg-slate-900/40"
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="grid grid-cols-24 gap-1 pt-2 text-[9px] font-mono text-slate-400 dark:text-slate-500 text-center">
            {peakAnalysis.hourlyBuckets.map((b) => (
              <span key={b.hour} className={b.hour % 3 === 0 ? "text-slate-700 dark:text-slate-300 font-medium" : ""}>
                {b.hour % 3 === 0 ? `${b.hour}h` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
