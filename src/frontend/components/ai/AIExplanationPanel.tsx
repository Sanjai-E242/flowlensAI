"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ProcessAnalysisResult,
  SimulationResult,
  AIExplanationResponse,
} from "@/shared/types";
import { buildDeterministicClientExplanation } from "@/shared/ai-deterministic-builder";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { SimulationExplanationCard } from "./SimulationExplanationCard";
import {
  Sparkles,
  Cpu,
  RefreshCw,
  Hourglass,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  HelpCircle,
} from "lucide-react";

interface AIExplanationPanelProps {
  analysis: ProcessAnalysisResult;
  simulationResult?: SimulationResult | null;
  targetStage?: string;
  mlPredictions?: import("@/shared/types").MLProcessPredictions | null;
}

export function AIExplanationPanel({
  analysis,
  simulationResult,
  targetStage,
  mlPredictions,
}: AIExplanationPanelProps) {
  const activeStage =
    targetStage || analysis.bottleneckCandidates[0]?.stageName || analysis.stages[0]?.stageName || "Verification";

  const dominantCandidate =
    analysis.bottleneckCandidates.find((b) => b.stageName === activeStage) ||
    analysis.bottleneckCandidates[0];

  // Active view tab: "BOTTLENECK" | "SIMULATION" | "EXECUTIVE"
  const [activeTab, setActiveTab] = useState<"BOTTLENECK" | "SIMULATION" | "EXECUTIVE">(
    "BOTTLENECK"
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // In-memory cache keyed by analysis dataset name, stage, and simulation intervention
  const [explanationCache, setExplanationCache] = useState<
    Record<string, AIExplanationResponse>
  >({});

  const cacheKey = useMemo(() => {
    const simKey = simulationResult?.scenario?.name || "no-sim";
    return `${analysis.datasetSummary.name}::${activeStage}::${simKey}`;
  }, [analysis.datasetSummary.name, activeStage, simulationResult]);

  // Default deterministic explanation constructed synchronously on dataset load
  const defaultExplanation = useMemo(() => {
    return buildDeterministicClientExplanation(analysis, simulationResult, activeStage);
  }, [analysis, simulationResult, activeStage]);

  // Current explanation: either cached from Gemini call or instantly derived deterministic insight
  const currentExplanation = explanationCache[cacheKey] || defaultExplanation;

  // Check if active model is Gemini or Deterministic Fallback
  const isGemini =
    currentExplanation?.metadata?.model &&
    currentExplanation.metadata.model !== "deterministic-fallback" &&
    !currentExplanation.metadata.model.includes("fallback");

  // User trigger to enhance with Gemini AI
  const handleExplainWithAi = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          simulation: simulationResult || null,
          targetStage: activeStage,
          mlPredictions,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExplanationCache((prev) => ({
          ...prev,
          [cacheKey]: data as AIExplanationResponse,
        }));
      } else {
        // Fall back gracefully to verified deterministic explanation without error badges
        const fallback = buildDeterministicClientExplanation(analysis, simulationResult, activeStage);
        setExplanationCache((prev) => ({
          ...prev,
          [cacheKey]: fallback,
        }));
      }
    } catch {
      // Offline/network resiliency: remain on verified deterministic explanation
      const fallback = buildDeterministicClientExplanation(analysis, simulationResult, activeStage);
      setExplanationCache((prev) => ({
        ...prev,
        [cacheKey]: fallback,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [analysis, simulationResult, activeStage, mlPredictions, cacheKey]);

  const rootCause = analysis.rootCauses[activeStage];

  return (
    <section className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-950/80 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl relative overflow-hidden space-y-5 transition-colors duration-200">
      {/* Decorative ambient background glow */}
      <div className="ambient-glow -top-24 -right-24 w-80 h-80 bg-indigo-600/15 pointer-events-none" />
      <div className="ambient-glow -bottom-24 -left-24 w-80 h-80 bg-cyan-600/10 pointer-events-none" />

      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400/30 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                {isGemini ? "✦ GEMINI AI INSIGHT" : "✦ VERIFIED PROCESS INSIGHT"}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {isGemini ? "Evidence-Grounded Explanation" : "Evidence-Grounded Analysis"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {isGemini ? "Gemini AI Active" : "Verified Evidence Mode"}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Executive Process Intelligence & Narration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Converts verified deterministic bottleneck evidence into human-readable business insights.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleExplainWithAi}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing evidence...</span>
              </>
            ) : isGemini ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerate AI Insight</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Enhance with Gemini AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("BOTTLENECK")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "BOTTLENECK"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          Bottleneck Root Cause
        </button>

        {simulationResult && (
          <button
            type="button"
            onClick={() => setActiveTab("SIMULATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "SIMULATION"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Simulation & Migration
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("EXECUTIVE")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "EXECUTIVE"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Executive Summary
        </button>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-slate-50/60 dark:bg-slate-900/50 p-8 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
          <div className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-bold">
            Synthesizing evidence-grounded operational narrative...
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Strictly verifying numbers against FlowLens deterministic queue calculations.
          </p>
        </div>
      )}

      {/* Render Active View */}
      {!isLoading && (
        <div className="space-y-4">
          {activeTab === "BOTTLENECK" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (7 Cols): Narrative Explanation */}
              <div className="lg:col-span-7 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-slate-950/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
                      {isGemini ? "GEMINI AI INSIGHT" : "VERIFIED PROCESS INSIGHT"}
                    </span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      Stage: <strong className="text-slate-900 dark:text-white">{activeStage}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {isGemini ? "Based on verified FlowLens metrics" : "Deterministic Engine"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Why is {activeStage} slowing down?
                  </h3>
                  <div className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed whitespace-pre-line font-medium space-y-2">
                    {currentExplanation.explanation.bottleneckExplanation}
                  </div>
                </div>

                {currentExplanation.explanation.summary && (
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 p-3 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    <span className="font-bold text-indigo-950 dark:text-indigo-100 uppercase text-[10px] block font-mono mb-1">
                      Key Takeaway
                    </span>
                    {currentExplanation.explanation.summary}
                  </div>
                )}

                {/* Analytical Assumptions & Boundaries */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-slate-500" />
                    Analytical Assumptions & Boundaries
                  </div>
                  <ul className="space-y-0.5 list-disc list-inside">
                    {currentExplanation.explanation.assumptions.map((assump, idx) => (
                      <li key={idx}>{assump}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column (5 Cols): CALCULATED DATA (Deterministic Facts) */}
              <div className="lg:col-span-5 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-white dark:bg-slate-900/60 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-cyan-100 dark:border-cyan-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                      CALCULATED DATA
                    </span>
                    <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300 font-semibold">
                      Deterministic Facts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Engine Output
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Score */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Delay Score:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {dominantCandidate ? dominantCandidate.delayContributionScore : 0} / 100
                    </span>
                  </div>

                  {/* Primary Factor */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Primary Bottleneck DNA:</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                      {dominantCandidate?.dna.primaryFactor || "WAITING"} Heavy
                    </span>
                  </div>

                  {/* Process Baseline Context */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Process Baseline:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {analysis.processMetrics.formattedAvgCycleTime} (Wait: {analysis.processMetrics.formattedAvgWaitingTime})
                    </span>
                  </div>

                  {/* Stage-Specific Queue Wait */}
                  {dominantCandidate && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Hourglass className="h-3 w-3 text-indigo-500" />
                        {activeStage} Queue Wait:
                      </span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                        {dominantCandidate.stageMetrics.formattedAvgWaitingTime} ({dominantCandidate.stageMetrics.waitingContributionPct}% of wait)
                      </span>
                    </div>
                  )}

                  {/* Stage-Specific Processing */}
                  {dominantCandidate && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-cyan-500" />
                        {activeStage} Processing:
                      </span>
                      <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                        {dominantCandidate.stageMetrics.formattedAvgProcessingTime} ({dominantCandidate.stageMetrics.processingContributionPct}% of work)
                      </span>
                    </div>
                  )}

                  {/* Peak Evidence */}
                  {analysis.peakAnalysis.peakHours.length > 0 && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Peak Window:</span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">
                        {analysis.peakAnalysis.peakHours[0]}
                      </span>
                    </div>
                  )}

                  {/* Associated Resources */}
                  {rootCause && rootCause.evidence.associatedResources && (
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                        Workload Concentration:
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 text-[11px]">
                        Associated with {rootCause.evidence.associatedResources.join(", ")}
                        {rootCause.evidence.resourceWorkloadSharePct
                          ? ` (${rootCause.evidence.resourceWorkloadSharePct}% share)`
                          : ""}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extracted Evidence Bullet Points */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
                    Evidence Verified by Engine:
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    {currentExplanation.explanation.evidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "SIMULATION" && currentExplanation.detailedSimulation && (
            <SimulationExplanationCard
              simulationExplanation={currentExplanation.detailedSimulation}
              migrationExplanation={currentExplanation.detailedMigration}
            />
          )}

          {activeTab === "EXECUTIVE" && currentExplanation.executiveSummary && (
            <ExecutiveSummaryCard
              summary={currentExplanation.executiveSummary}
              isSimulated={Boolean(simulationResult)}
            />
          )}
        </div>
      )}

      {/* Transparency Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>
            FlowLens calculates metrics deterministically. Natural-language explanation is grounded directly in verified process evidence.
          </span>
        </div>
        <div>
          Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Deterministic Guard Active</span>
        </div>
      </div>
    </section>
  );
}
