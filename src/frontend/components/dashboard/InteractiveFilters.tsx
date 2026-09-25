"use client";

import React from "react";
import { Filter, RotateCcw, X } from "lucide-react";

interface InteractiveFiltersProps {
  stages: string[];
  resources: string[];
  priorities?: string[];
  locations?: string[];
  selectedStageFilter: string;
  selectedResourceFilter: string;
  selectedDnaFilter: string;
  selectedPriorityFilter?: string;
  selectedLocationFilter?: string;
  onStageChange: (stage: string) => void;
  onResourceChange: (resource: string) => void;
  onDnaChange: (dna: string) => void;
  onPriorityChange?: (priority: string) => void;
  onLocationChange?: (location: string) => void;
  onReset: () => void;
  matchingCount?: number;
}

export function InteractiveFilters({
  stages,
  resources,
  priorities = [],
  locations = [],
  selectedStageFilter,
  selectedResourceFilter,
  selectedDnaFilter,
  selectedPriorityFilter = "ALL",
  selectedLocationFilter = "ALL",
  onStageChange,
  onResourceChange,
  onDnaChange,
  onPriorityChange,
  onLocationChange,
  onReset,
  matchingCount,
}: InteractiveFiltersProps) {
  const hasActiveFilters =
    selectedStageFilter !== "ALL" ||
    selectedResourceFilter !== "ALL" ||
    selectedDnaFilter !== "ALL" ||
    selectedPriorityFilter !== "ALL" ||
    selectedLocationFilter !== "ALL";

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-sm shadow-sm transition-colors duration-200 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Filter className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span>Interactive Analytical Filters</span>
          {matchingCount !== undefined && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {matchingCount} matching
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => onStageChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Stages ({stages.length})</option>
            {stages.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Resource Filter */}
          {resources.length > 0 && (
            <select
              value={selectedResourceFilter}
              onChange={(e) => onResourceChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Resources ({resources.length})</option>
              {resources.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>
          )}

          {/* DNA Signal Filter */}
          <select
            value={selectedDnaFilter}
            onChange={(e) => onDnaChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All DNA Signals</option>
            <option value="WAITING">WAITING (Queue Heavy)</option>
            <option value="PROCESSING">PROCESSING (Duration Heavy)</option>
            <option value="VARIABILITY">VARIABILITY (High Volatility)</option>
            <option value="VOLUME">VOLUME (High Density)</option>
            <option value="RESOURCE">RESOURCE (Workload Overload)</option>
            <option value="PEAK">PEAK (Temporal Spikes)</option>
          </select>

          {/* Optional Priority Filter (Only if dataset provides priority) */}
          {priorities.length > 0 && onPriorityChange && (
            <select
              value={selectedPriorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Priorities ({priorities.length})</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>
          )}

          {/* Optional Location Filter (Only if dataset provides location) */}
          {locations.length > 0 && onLocationChange && (
            <select
              value={selectedLocationFilter}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Locations ({locations.length})</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer font-mono"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
          <span className="text-slate-500 text-[10px] mr-1">Active:</span>
          {selectedStageFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
              Stage: {selectedStageFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-cyan-950 dark:hover:text-white"
                onClick={() => onStageChange("ALL")}
              />
            </span>
          )}
          {selectedResourceFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Resource: {selectedResourceFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-purple-950 dark:hover:text-white"
                onClick={() => onResourceChange("ALL")}
              />
            </span>
          )}
          {selectedDnaFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              DNA: {selectedDnaFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-rose-950 dark:hover:text-white"
                onClick={() => onDnaChange("ALL")}
              />
            </span>
          )}
          {selectedPriorityFilter !== "ALL" && onPriorityChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Priority: {selectedPriorityFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-amber-950 dark:hover:text-white"
                onClick={() => onPriorityChange("ALL")}
              />
            </span>
          )}
          {selectedLocationFilter !== "ALL" && onLocationChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              Location: {selectedLocationFilter}
              <X
                className="h-3 w-3 cursor-pointer hover:text-indigo-950 dark:hover:text-white"
                onClick={() => onLocationChange("ALL")}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
