"use client";

import React from "react";
import { ExecutiveSummary } from "@/shared/types";
import {
  FileText,
  AlertTriangle,
  TrendingDown,
  Shuffle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary;
  isSimulated?: boolean;
}

export function ExecutiveSummaryCard({
  summary,
  isSimulated = false,
}: ExecutiveSummaryCardProps) {
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/30 p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 font-bold">
                Executive Briefing
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Structured Synthesis
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {summary.headline}
            </h3>
          </div>
        </div>

        {summary.wordCount && (
          <span className="text-[11px] font-mono text-slate-500 dark:text-indigo-300/80 self-start sm:self-auto">
            Briefing length: ~{summary.wordCount} words
          </span>
        )}
      </div>

      {/* 6 Key Operational Dimensions */}
      <div className="space-y-3.5 text-xs">
        {/* Q1: Primary Constraint */}
        <div className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            1. Primary Process Constraint
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {summary.processSlowingStage}
          </p>
        </div>

        {/* Q2: Lead-Time Impact */}
        <div className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-rose-500" />
            2. Operational Lead-Time Impact
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {summary.operationalImpact}
          </p>
        </div>

        {/* Q3: Deterministic Evidence */}
        <div className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            3. Deterministic Supporting Evidence
          </div>
          <ul className="space-y-1 mt-1 text-slate-700 dark:text-slate-300">
            {summary.supportingEvidence.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[10px] mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Q4 & Q5: Simulated Intervention & Migration (if present) */}
        {isSimulated && summary.simulatedInterventionImpact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 p-3 shadow-sm">
              <div className="text-[10px] font-mono uppercase text-cyan-800 dark:text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                <TrendingDown className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                4. Simulated Intervention Impact
              </div>
              <p className="text-slate-800 dark:text-cyan-100 leading-relaxed font-medium">
                {summary.simulatedInterventionImpact}
              </p>
            </div>

            <div className="rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 p-3 shadow-sm">
              <div className="text-[10px] font-mono uppercase text-purple-800 dark:text-purple-300 font-bold mb-1 flex items-center gap-1.5">
                <Shuffle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                5. Simulated Bottleneck Migration
              </div>
              <p className="text-slate-800 dark:text-purple-100 leading-relaxed font-medium">
                {summary.migrationOutlook || "Constraint remains at dominant stage."}
              </p>
            </div>
          </div>
        )}

        {/* Q6: Limitations */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 p-3">
          <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-slate-500" />
            6. Analytical Boundaries & Data Limitations
          </div>
          <ul className="space-y-1 mt-1 text-slate-500 dark:text-slate-400 text-[11px]">
            {summary.dataLimitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 font-mono">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
