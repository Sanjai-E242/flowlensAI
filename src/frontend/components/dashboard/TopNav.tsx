"use client";

import React, { useState } from "react";
import {
  Activity,
  UploadCloud,
  Sparkles,
  Sun,
  Moon,
  RotateCcw,
  ChevronDown,
  Building,
  Truck,
  Landmark,
  Headphones,
  Stethoscope,
  Cpu,
} from "lucide-react";
import { useTheme } from "@/frontend/hooks/useTheme";
import { DEMO_PRESETS, DemoDatasetPreset } from "@/data/industry-datasets";

interface TopNavProps {
  datasetName: string;
  domain?: string;
  onOpenUpload: () => void;
  onSelectPreset: (preset: DemoDatasetPreset) => void;
  onResetAnalysis: () => void;
  isAnalyzing: boolean;
  persistedDatasetId?: string;
}

export function TopNav({
  datasetName,
  domain = "General Operations",
  onOpenUpload,
  onSelectPreset,
  onResetAnalysis,
  isAnalyzing,
}: TopNavProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);

  const getDomainIcon = (d: string) => {
    switch (d) {
      case "Manufacturing":
        return <Cpu className="h-3.5 w-3.5" />;
      case "Logistics":
        return <Truck className="h-3.5 w-3.5" />;
      case "Banking":
        return <Landmark className="h-3.5 w-3.5" />;
      case "Customer Operations":
        return <Headphones className="h-3.5 w-3.5" />;
      case "Healthcare":
        return <Stethoscope className="h-3.5 w-3.5" />;
      default:
        return <Building className="h-3.5 w-3.5" />;
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Domain Metadata */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/20 ring-1 ring-cyan-500/30 shrink-0">
            <Activity className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                FLOWLENS <span className="text-cyan-600 dark:text-cyan-400">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                |
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Universal Process Intelligence
              </span>

              {/* Dynamic Domain Badge */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70">
                {getDomainIcon(domain)}
                <span>{domain}</span>
              </span>

              {/* Local Engine Status */}
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Universal Engine Active
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md mt-0.5">
              Active Log:{" "}
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {datasetName}
              </span>
            </p>
          </div>
        </div>

        {/* Section Navigation Links (Desktop) */}
        <nav aria-label="Section Navigation" className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => scrollToSection("process-map")}
            className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Topology
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("bottleneck-section")}
            className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Bottlenecks
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("stage-matrix")}
            className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Stage Matrix
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("what-if-lab")}
            className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            What-If Lab
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("ai-panel")}
            className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            AI Evidence
          </button>
        </nav>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Industry Demo Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Industry Presets</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isDemoMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsDemoMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Select Industry Demo:
                </div>
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(p);
                      setIsDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 flex items-center justify-between text-slate-700 dark:text-slate-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {getDomainIcon(p.domain)}
                      </span>
                      <span className="font-medium text-xs">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {p.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload CSV */}
          <button
            type="button"
            onClick={onOpenUpload}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload CSV</span>
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 transition cursor-pointer"
            aria-label={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
            title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {/* Reset / New Analysis */}
          <button
            type="button"
            onClick={onResetAnalysis}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 transition cursor-pointer"
            title="Reset Analysis & Clear Dataset"
            aria-label="Reset Analysis"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
