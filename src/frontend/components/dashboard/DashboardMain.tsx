"use client";

import React, { useState, useMemo, useRef } from "react";
import { ProcessAnalysisResult, SimulationResult, ColumnMappingConfig, ProcessDomain } from "@/shared/types";
import { analyzeProcess } from "@/backend/engine";
import { simulateScenario } from "@/backend/simulation";
import { SYNTHETIC_HIDDEN_BOTTLENECK_CSV } from "@/data/synthetic-dataset";
import { DEMO_PRESETS, DemoDatasetPreset } from "@/data/industry-datasets";
import { TopNav } from "./TopNav";
import { ProcessOverviewCards } from "./ProcessOverviewCards";
import { ProcessFlowGraph } from "./ProcessFlowGraph";
import { BottleneckIntelligencePanel } from "./BottleneckIntelligencePanel";
import { StageComparisonChart } from "./StageComparisonChart";
import { ProcessStageTable } from "./ProcessStageTable";
import { ResourceIntelligencePanel } from "./ResourceIntelligencePanel";
import { PeakAnalysisPanel } from "./PeakAnalysisPanel";
import { InteractiveFilters } from "./InteractiveFilters";
import { DatasetUploadModal } from "../upload/DatasetUploadModal";
import { WhatIfSimulator } from "../simulation/WhatIfSimulator";
import { AIExplanationPanel } from "../ai/AIExplanationPanel";
import {
  AlertCircle,
  UploadCloud,
  Sparkles,
  Factory,
  Truck,
  CreditCard,
  Headphones,
  Stethoscope,
  Cpu,
  ArrowRight,
} from "lucide-react";

export function DashboardMain() {
  // Deterministic baseline analysis pre-loaded with synthetic hidden-bottleneck dataset
  const initialAnalysis = useMemo(() => {
    return analyzeProcess(SYNTHETIC_HIDDEN_BOTTLENECK_CSV, {
      datasetName: "Synthetic Benchmark: Hidden Queue Bottleneck",
    });
  }, []);

  const [analysis, setAnalysis] = useState<ProcessAnalysisResult | null>(initialAnalysis);
  const [selectedStageName, setSelectedStageName] = useState<string>(
    initialAnalysis.bottleneckCandidates[0]?.stageName || "Verification"
  );
  const [userSimulation, setUserSimulation] = useState<SimulationResult | null>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  const handleScrollToAiPanel = () => {
    aiPanelRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filters state (Part 22)
  const [selectedStageFilter, setSelectedStageFilter] = useState("ALL");
  const [selectedResourceFilter, setSelectedResourceFilter] = useState("ALL");
  const [selectedDnaFilter, setSelectedDnaFilter] = useState("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("ALL");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("ALL");

  // Modal & API states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persistedDatasetId, setPersistedDatasetId] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  // Extract optional priorities and locations from dataset cases if present
  const { priorities, locations } = useMemo(() => {
    if (!analysis) return { priorities: [], locations: [] };
    const prioSet = new Set<string>();
    const locSet = new Set<string>();

    analysis.cases.forEach((c) => {
      c.events.forEach((ev) => {
        if (ev.priority) prioSet.add(ev.priority);
        if (ev.location) locSet.add(ev.location);
      });
    });

    return {
      priorities: Array.from(prioSet),
      locations: Array.from(locSet),
    };
  }, [analysis]);

  // Filtered views based on user selection
  const filteredStages = useMemo(() => {
    if (!analysis) return [];
    let result = analysis.stages;

    if (selectedStageFilter !== "ALL") {
      result = result.filter((s) => s.stageName === selectedStageFilter);
    }
    if (selectedDnaFilter !== "ALL") {
      const matchCandidates = new Set(
        analysis.bottleneckCandidates
          .filter((b) => b.dna.primaryFactor === selectedDnaFilter)
          .map((b) => b.stageName)
      );
      result = result.filter((s) => matchCandidates.has(s.stageName));
    }
    if (selectedResourceFilter !== "ALL") {
      const resourceObj = analysis.resources.find(
        (r) => r.resourceId === selectedResourceFilter
      );
      if (resourceObj) {
        const handledSet = new Set(resourceObj.stagesHandled);
        result = result.filter((s) => handledSet.has(s.stageName));
      }
    }
    if (selectedPriorityFilter !== "ALL") {
      const matchingCases = new Set(
        analysis.cases
          .filter((c) => c.events.some((ev) => ev.priority === selectedPriorityFilter))
          .flatMap((c) => c.stageSequence)
      );
      result = result.filter((s) => matchingCases.has(s.stageName));
    }
    if (selectedLocationFilter !== "ALL") {
      const matchingCases = new Set(
        analysis.cases
          .filter((c) => c.events.some((ev) => ev.location === selectedLocationFilter))
          .flatMap((c) => c.stageSequence)
      );
      result = result.filter((s) => matchingCases.has(s.stageName));
    }

    return result;
  }, [
    analysis,
    selectedStageFilter,
    selectedDnaFilter,
    selectedResourceFilter,
    selectedPriorityFilter,
    selectedLocationFilter,
  ]);

  // Ensure selectedStageName stays aligned with filtered stages
  const activeSelectedStageName = useMemo(() => {
    if (!analysis) return "";
    const isPresent = filteredStages.some((s) => s.stageName === selectedStageName);
    if (isPresent) return selectedStageName;
    return filteredStages[0]?.stageName || analysis.stages[0]?.stageName || "";
  }, [filteredStages, selectedStageName, analysis]);

  const dominantCandidate = analysis?.bottleneckCandidates[0];
  const selectedCandidate =
    analysis?.bottleneckCandidates.find((b) => b.stageName === activeSelectedStageName) ||
    dominantCandidate;

  const currentRootCause = analysis && selectedCandidate
    ? analysis.rootCauses[selectedCandidate.stageName]
    : undefined;

  // Derive default deterministic simulation (+2 resources on dominant bottleneck)
  const defaultSimulation = useMemo(() => {
    if (!analysis || !dominantCandidate) return null;
    try {
      return simulateScenario(analysis, {
        name: `Default: +2 Resources on ${dominantCandidate.stageName}`,
        interventions: [
          {
            type: "RESOURCE_INCREASE",
            stage: dominantCandidate.stageName,
            additionalResources: 2,
          },
        ],
      });
    } catch {
      return null;
    }
  }, [analysis, dominantCandidate]);

  const simulationResult = userSimulation ?? defaultSimulation;

  // Handler for analyzing new CSV content via server API
  const handleAnalyzeCsv = async (
    csvText: string,
    datasetName: string,
    persist: boolean,
    columnMapping?: ColumnMappingConfig,
    domainOverride?: ProcessDomain
  ) => {
    setIsAnalyzing(true);
    setApiError(null);

    try {
      const res = await fetch("/api/datasets/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: csvText,
          datasetName,
          persist,
          columnMapping,
          domainOverride,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg =
          data.message || data.error || "Failed to analyze the uploaded CSV dataset.";
        setApiError(errMsg);
        return;
      }

      setAnalysis(data.analysis);
      if (data.persistedDatasetId) {
        setPersistedDatasetId(data.persistedDatasetId);
      }
      if (data.analysis.bottleneckCandidates.length > 0) {
        setSelectedStageName(data.analysis.bottleneckCandidates[0].stageName);
      }
      // Reset active filters
      setSelectedStageFilter("ALL");
      setSelectedResourceFilter("ALL");
      setSelectedDnaFilter("ALL");
      setSelectedPriorityFilter("ALL");
      setSelectedLocationFilter("ALL");
      setUserSimulation(null);
    } catch (err) {
      setApiError(`Network error executing process analysis: ${(err as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for selecting any industry demo preset
  const handleSelectPreset = (presetOrId: DemoDatasetPreset | string) => {
    const preset =
      typeof presetOrId === "string"
        ? DEMO_PRESETS.find((p) => p.id === presetOrId)
        : presetOrId;
    if (!preset) return;

    try {
      const presetAnalysis = analyzeProcess(preset.csv, {
        datasetName: preset.name,
        domainOverride: preset.domain,
      });

      setAnalysis(presetAnalysis);
      setSelectedStageName(
        presetAnalysis.bottleneckCandidates[0]?.stageName ||
          presetAnalysis.stages[0]?.stageName ||
          ""
      );
      setSelectedStageFilter("ALL");
      setSelectedResourceFilter("ALL");
      setSelectedDnaFilter("ALL");
      setSelectedPriorityFilter("ALL");
      setSelectedLocationFilter("ALL");
      setUserSimulation(null);
      setApiError(null);
    } catch (err) {
      setApiError(`Failed to load preset ${preset.name}: ${(err as Error).message}`);
    }
  };

  // Handler for resetting analysis (Part 23)
  const handleResetAnalysis = () => {
    setAnalysis(null);
    setSelectedStageName("");
    setUserSimulation(null);
    setSelectedStageFilter("ALL");
    setSelectedResourceFilter("ALL");
    setSelectedDnaFilter("ALL");
    setSelectedPriorityFilter("ALL");
    setSelectedLocationFilter("ALL");
    setApiError(null);
  };

  const stageNames = useMemo(
    () => (analysis ? analysis.stages.map((s) => s.stageName) : []),
    [analysis]
  );
  const resourceIds = useMemo(
    () => (analysis ? analysis.resources.map((r) => r.resourceId) : []),
    [analysis]
  );

  const caseSequences = useMemo(
    () => (analysis ? analysis.cases.map((c) => c.stageSequence) : []),
    [analysis]
  );

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Background Decorative Grid & Ambient Glows */}
      <div className="flowlens-grid-bg absolute inset-0 pointer-events-none z-0" />
      <div className="ambient-glow -top-32 -left-32 w-96 h-96 bg-cyan-600/25 dark:bg-cyan-600/30" />
      <div className="ambient-glow top-1/3 -right-24 w-[30rem] h-[30rem] bg-indigo-600/15 dark:bg-indigo-600/20" />
      <div className="ambient-glow -bottom-32 left-1/3 w-96 h-96 bg-violet-600/15 dark:bg-violet-600/20" />

      {/* Top Navigation Bar */}
      <TopNav
        datasetName={analysis ? analysis.datasetSummary.name : "No Dataset Active"}
        domain={analysis?.domainInfo?.domain}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectPreset={handleSelectPreset}
        onResetAnalysis={handleResetAnalysis}
        isAnalyzing={isAnalyzing}
        persistedDatasetId={persistedDatasetId}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Error notification banner if API returns error */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-white font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Universal Empty State / Industry Benchmark Launchpad */}
        {!analysis && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl p-8 sm:p-14 text-center space-y-8 shadow-xl">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>UNIVERSAL EVENT-LOG PROCESS INTELLIGENCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Where does your process actually slow down?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                FlowLens AI ingests event logs across any industry, reconstructs case lifecycles, isolates hidden bottleneck stages via Kingman queue physics, and simulates capacity interventions with bottleneck migration detection.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition cursor-pointer font-mono"
              >
                <UploadCloud className="h-5 w-5" />
                <span>UPLOAD CSV EVENT LOG</span>
              </button>
            </div>

            {/* Multi-Industry Demo Presets Grid */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                Or launch an industry benchmark dataset:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl mx-auto text-left">
                {DEMO_PRESETS.map((preset) => {
                  let Icon = Sparkles;
                  if (preset.domain === "Manufacturing") Icon = Factory;
                  else if (preset.domain === "Logistics") Icon = Truck;
                  else if (preset.domain === "Banking") Icon = CreditCard;
                  else if (preset.domain === "Customer Operations") Icon = Headphones;
                  else if (preset.domain === "Healthcare") Icon = Stethoscope;
                  else if (preset.domain === "Enterprise Operations") Icon = Cpu;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 transition cursor-pointer flex flex-col justify-between space-y-2 text-left hover:border-cyan-500/50 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {preset.domain}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition flex items-center gap-1">
                          <span>{preset.name}</span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Populated Analysis View */}
        {analysis && (
          <>
            {/* Section A: Hero Headline & Process Overview KPI Cards (Part 6) */}
            <section aria-label="Process Macro Overview" className="section-fade-in">
              <ProcessOverviewCards
                metrics={analysis.processMetrics}
                datasetSummary={analysis.datasetSummary}
                domainInfo={analysis.domainInfo}
              />
            </section>

            {/* Section B: 2D Sequential Process Topology Flow Graph - THE PRIMARY VISUAL HERO */}
            <section aria-label="Process Flow Topology" className="section-fade-in">
              <ProcessFlowGraph
                stages={filteredStages.length > 0 ? filteredStages : analysis.stages}
                bottlenecks={analysis.bottleneckCandidates}
                transitions={analysis.transitions}
                selectedStageName={activeSelectedStageName}
                onSelectStage={setSelectedStageName}
                caseSequences={caseSequences}
              />
            </section>

            {/* Section C: Dominant Bottleneck Intelligence & Evidence */}
            {dominantCandidate && (
              <section aria-label="Bottleneck Intelligence" className="section-fade-in">
                <BottleneckIntelligencePanel
                  dominantCandidate={dominantCandidate}
                  selectedCandidate={selectedCandidate || dominantCandidate}
                  rootCause={currentRootCause}
                  onSelectStage={setSelectedStageName}
                  nextStageName={
                    analysis.stages.find(
                      (_, i) => analysis.stages[i - 1]?.stageName === activeSelectedStageName
                    )?.stageName
                  }
                />
              </section>
            )}

            {/* Section D: What-If Intervention Lab & Bottleneck Migration Engine */}
            <section aria-label="What-If Intervention Lab" className="section-fade-in">
              <WhatIfSimulator
                key={analysis.datasetSummary.name}
                analysis={analysis}
                simulationResult={simulationResult}
                onSimulationChange={setUserSimulation}
                onExplainWithAiClick={handleScrollToAiPanel}
              />
            </section>

            {/* Section E: AI Explanation & Verified Process Intelligence */}
            <div ref={aiPanelRef} className="section-fade-in">
              <section aria-label="AI Process Intelligence">
                <AIExplanationPanel
                  key={analysis.datasetSummary.name}
                  analysis={analysis}
                  simulationResult={simulationResult}
                  targetStage={activeSelectedStageName}
                />
              </section>
            </div>

            {/* Section F: Deep-Dive Operational Exploration & Detailed Analytics */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 section-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                    Deep-Dive Operational Exploration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Granular stage metrics, temporal arrival distribution, resource allocation, and interactive filtering.
                  </p>
                </div>
              </div>

              {/* Interactive Filters Toolbar */}
              <InteractiveFilters
                stages={stageNames}
                resources={resourceIds}
                priorities={priorities}
                locations={locations}
                selectedStageFilter={selectedStageFilter}
                selectedResourceFilter={selectedResourceFilter}
                selectedDnaFilter={selectedDnaFilter}
                selectedPriorityFilter={selectedPriorityFilter}
                selectedLocationFilter={selectedLocationFilter}
                onStageChange={setSelectedStageFilter}
                onResourceChange={setSelectedResourceFilter}
                onDnaChange={setSelectedDnaFilter}
                onPriorityChange={setSelectedPriorityFilter}
                onLocationChange={setSelectedLocationFilter}
                onReset={() => {
                  setSelectedStageFilter("ALL");
                  setSelectedResourceFilter("ALL");
                  setSelectedDnaFilter("ALL");
                  setSelectedPriorityFilter("ALL");
                  setSelectedLocationFilter("ALL");
                }}
                matchingCount={filteredStages.length}
              />

              {/* Stage Matrix Table */}
              <section aria-label="Process Stage Performance Matrix">
                <ProcessStageTable
                  stages={filteredStages.length > 0 ? filteredStages : analysis.stages}
                  bottlenecks={analysis.bottleneckCandidates}
                  selectedStageName={activeSelectedStageName}
                  onSelectStage={setSelectedStageName}
                />
              </section>

              {/* Stage Comparison Chart & Peak Temporal Windows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section aria-label="Stage Delay Comparison">
                  <StageComparisonChart
                    stages={filteredStages.length > 0 ? filteredStages : analysis.stages}
                    bottlenecks={analysis.bottleneckCandidates}
                    selectedStageName={activeSelectedStageName}
                    onSelectStage={setSelectedStageName}
                  />
                </section>

                <section aria-label="Temporal Dynamics & Peak Windows">
                  <PeakAnalysisPanel peakAnalysis={analysis.peakAnalysis} />
                </section>
              </div>

              {/* Resource Workload Intelligence */}
              <section aria-label="Resource Workload Intelligence">
                <ResourceIntelligencePanel resources={analysis.resources} />
              </section>
            </div>
          </>
        )}
      </main>

      {/* Dataset Upload Modal */}
      <DatasetUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalyze={handleAnalyzeCsv}
        isAnalyzing={isAnalyzing}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 py-5 px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <span>
            <strong className="text-slate-800 dark:text-slate-300 font-bold">FLOWLENS AI</strong>
            {" — "}Enterprise Process Intelligence + What-If Simulation
          </span>
          <span className="flex items-center gap-3">
            <span>Deterministic Engine</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-700" />
            <span>Kingman Queue Physics</span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-700" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Local Verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
