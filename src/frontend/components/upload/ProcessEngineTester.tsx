"use client";

import React, { useState } from "react";
import {
  Upload,
  AlertCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Layers,
  FileText,
} from "lucide-react";
import { ProcessAnalysisResult } from "@/shared/types";
import { analyzeProcess } from "@/backend/engine";
import { SYNTHETIC_HIDDEN_BOTTLENECK_CSV } from "@/data/synthetic-dataset";

export function ProcessEngineTester() {
  const [csvInput, setCsvInput] = useState<string>("");
  const [datasetName, setDatasetName] = useState<string>("My Process Dataset");
  const [analysisResult, setAnalysisResult] = useState<ProcessAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  const handleLoadSynthetic = () => {
    setCsvInput(SYNTHETIC_HIDDEN_BOTTLENECK_CSV);
    setDatasetName("Hidden Bottleneck Benchmark (10 Cases)");
    setFileName("synthetic-hidden-bottleneck.csv");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDatasetName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text || "");
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = () => {
    if (!csvInput.trim()) return;

    setIsProcessing(true);
    try {
      const result = analyzeProcess(csvInput, { datasetName });
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis execution error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setCsvInput("");
    setAnalysisResult(null);
    setFileName("");
  };

  const topBottleneck = analysisResult?.bottleneckCandidates?.[0];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-md shadow-xl flex flex-col gap-6">
      {/* Engine Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              Phase 1 Engine Tester
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Deterministic Event Processing Sandbox
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test canonical CSV parsing, chronological case reconstruction, waiting time analysis, and bottleneck scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSynthetic}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Load Hidden Bottleneck Data
          </button>
          {csvInput && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CSV Text Input Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="csv-input" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              Event CSV Content
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              Required: case_id, activity, start_time, end_time
            </span>
          </div>

          <textarea
            id="csv-input"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="case_id,activity,start_time,end_time,resource_id&#10;C101,Intake,2026-09-01 08:00,2026-09-01 08:10,R01&#10;C101,Verification,2026-09-01 11:30,2026-09-01 11:45,R02..."
            rows={8}
            className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition resize-y"
          />
        </div>

        {/* Upload Controls & Settings */}
        <div className="flex flex-col justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="dataset-name" className="text-xs font-medium text-slate-300 block mb-1">
                Dataset Name
              </label>
              <input
                id="dataset-name"
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="file-upload" className="text-xs font-medium text-slate-300 block mb-1">
                Upload CSV File
              </label>
              <div className="relative border border-dashed border-slate-700 rounded-lg p-3 text-center hover:border-slate-600 transition">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Upload className="h-4 w-4 text-cyan-400" />
                  <span>{fileName ? `Loaded: ${fileName}` : "Click to select or drag CSV file"}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={!csvInput.trim() || isProcessing}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Play className="h-3.5 w-3.5 fill-slate-950" />
            {isProcessing ? "Analyzing Events..." : "Run Deterministic Analysis"}
          </button>
        </div>
      </div>

      {/* Validation Errors Box */}
      {analysisResult && analysisResult.validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>Validation Notices ({analysisResult.validationErrors.length})</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-200/80 space-y-1">
            {analysisResult.validationErrors.map((err, idx) => (
              <li key={idx}>
                {err.rowIndex ? `[Row ${err.rowIndex}] ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Quality Issues Box */}
      {analysisResult && analysisResult.dataQualityIssues.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>Data Quality Observations ({analysisResult.dataQualityIssues.length})</span>
          </div>
          <ul className="list-disc list-inside text-xs text-sky-200/80 space-y-1">
            {analysisResult.dataQualityIssues.slice(0, 5).map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Analysis Output Results */}
      {analysisResult && analysisResult.datasetSummary.validEventsCount > 0 && (
        <div className="flex flex-col gap-6 pt-2">
          {/* Top Bottleneck Candidate Hero Banner */}
          {topBottleneck && (
            <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/50 via-slate-900/60 to-slate-900/40 p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-900/60 border border-red-500/80 flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-red-900/80 text-red-200 border border-red-700/60">
                        Primary Bottleneck #1
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        DNA: {topBottleneck.dna.primaryFactor}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {topBottleneck.stageName}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      {topBottleneck.rationale}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end shrink-0 pl-13 sm:pl-0">
                  <div className="text-2xl font-black text-red-400 font-mono">
                    {topBottleneck.delayContributionScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Delay Contribution Score
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    {topBottleneck.dna.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dataset Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Total Cases</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {analysisResult.processMetrics.totalCases}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Total Events</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {analysisResult.processMetrics.totalEvents}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Avg Lead Time</span>
              <p className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                {analysisResult.processMetrics.formattedAvgCycleTime}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Process Efficiency</span>
              <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {analysisResult.processMetrics.avgProcessEfficiencyPct}%
              </p>
            </div>
          </div>

          {/* Stage Metrics Breakdown Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Process Stage Analytics Breakdown
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {analysisResult.stages.length} Stages Identified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Stage Name</th>
                    <th className="py-2.5 px-4">Executions</th>
                    <th className="py-2.5 px-4">Avg Processing</th>
                    <th className="py-2.5 px-4">Avg Waiting</th>
                    <th className="py-2.5 px-4">Proc Share</th>
                    <th className="py-2.5 px-4">Wait Share</th>
                    <th className="py-2.5 px-4">Bottleneck Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {analysisResult.stages.map((stage) => {
                    const candidate = analysisResult.bottleneckCandidates.find(
                      (c) => c.stageName === stage.stageName
                    );
                    const isTop = candidate?.rank === 1;

                    return (
                      <tr
                        key={stage.stageName}
                        className={`hover:bg-slate-900/40 transition ${
                          isTop ? "bg-red-950/20 text-red-200" : "text-slate-300"
                        }`}
                      >
                        <td className="py-3 px-4 font-sans font-semibold flex items-center gap-2">
                          {isTop && <Flame className="h-3.5 w-3.5 text-red-400" />}
                          {stage.stageName}
                        </td>
                        <td className="py-3 px-4">{stage.eventCount}</td>
                        <td className="py-3 px-4 text-slate-300">{stage.formattedAvgProcessingTime}</td>
                        <td className="py-3 px-4 text-slate-300">{stage.formattedAvgWaitingTime}</td>
                        <td className="py-3 px-4 text-slate-400">{stage.processingContributionPct}%</td>
                        <td className="py-3 px-4 text-slate-400">{stage.waitingContributionPct}%</td>
                        <td className="py-3 px-4 font-bold text-cyan-300">
                          {candidate ? candidate.delayContributionScore : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
