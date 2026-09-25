"use client";

import React from "react";
import { MigrationResult } from "@/shared/types";
import { ArrowRight, Shuffle, Gauge, CheckCircle2, AlertTriangle } from "lucide-react";

interface MigrationAlertProps {
  migration: MigrationResult;
}

export function MigrationAlert({ migration }: MigrationAlertProps) {
  if (migration.migrated) {
    return (
      <div className="rounded-2xl border-2 border-amber-500/60 dark:border-amber-500/50 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/40 dark:via-purple-950/30 dark:to-slate-900/60 p-5 sm:p-6 shadow-lg shadow-amber-500/10 dark:shadow-amber-950/20 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Shuffle className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                  SIMULATED BOTTLENECK MIGRATION DETECTED
                </span>
                <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-300">
                  SIMULATED RESULT
                </span>
              </div>

              {/* Prominent Stage Shift Visualization */}
              <div className="mt-3 flex items-center gap-2 sm:gap-3 flex-wrap font-mono">
                <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-base font-bold shadow-sm">
                  {migration.fromStage}
                  <span className="text-xs ml-1.5 text-slate-500 dark:text-slate-400 font-normal">
                    (Rank 1 &rarr; #{migration.newRank})
                  </span>
                </div>

                <div className="flex items-center text-amber-600 dark:text-amber-400 font-bold text-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-500 text-amber-900 dark:text-amber-200 text-base font-extrabold shadow-sm">
                  {migration.toStage}
                  <span className="text-xs ml-1.5 text-amber-700 dark:text-amber-300 font-normal">
                    (New Dominant Delay)
                  </span>
                </div>
              </div>

              {/* Explanatory Narrative */}
              <p className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {migration.narrative}
              </p>

              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs font-semibold">
                <span>💡 Reducing the current bottleneck exposes the next limiting stage.</span>
              </div>

              <p className="mt-2 text-[11px] text-slate-500 font-mono">
                Note: This projection is a theoretical mathematical simulation and does not guarantee empirical real-world outcomes without systemic validation.
              </p>
            </div>
          </div>

          <div className="sm:self-center shrink-0 text-right bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">
              Relief at {migration.fromStage}
            </div>
            <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
              {migration.scoreChange} pts
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (migration.pattern === "MULTIPLE_BOTTLENECK_CONVERGENCE") {
    return (
      <div className="rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Gauge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40">
                Multiple Bottlenecks Converging
              </span>
              <span className="text-xs text-slate-500 font-mono">
                SIMULATED RESULT
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {migration.narrative}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (migration.pattern === "BOTTLENECK_IMPROVED_REMAINS_TOP") {
    return (
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                Bottleneck Relieved (Remains #1)
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                {migration.scoreChange} pts relief · SIMULATED RESULT
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {migration.narrative}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-slate-500 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
          {migration.narrative}
        </p>
      </div>
    </div>
  );
}
