"use client";

import React, { useState } from "react";
import { ResourceMetrics } from "@/shared/types";
import { Cpu, AlertCircle, CheckCircle2 } from "lucide-react";

interface ResourceIntelligencePanelProps {
  resources: ResourceMetrics[];
}

export function ResourceIntelligencePanel({ resources }: ResourceIntelligencePanelProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    resources.length > 0 ? resources[0].resourceId : null
  );

  const selectedResource = resources.find(
    (r) => r.resourceId === selectedResourceId
  );

  if (resources.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-6 text-center text-slate-500">
        <Cpu className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold">No Resource Telemetry</p>
        <p className="text-xs text-slate-400 mt-1">
          CSV did not contain resource_id columns or events were unassigned.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Resource Workload & Overload Intelligence
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-semibold">
              {resources.length} Performers
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Empirical workload share and stage concentration analysis using non-causal association metrics.
          </p>
        </div>
      </div>

      {/* Grid: Resource Table + Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Resource List / Table */}
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                <th className="pb-2.5 font-medium">Resource</th>
                <th className="pb-2.5 font-medium">Events</th>
                <th className="pb-2.5 font-medium">Workload Share</th>
                <th className="pb-2.5 font-medium">Avg Duration</th>
                <th className="pb-2.5 font-medium">Overload Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {resources.map((res) => {
                const isSelected = selectedResourceId === res.resourceId;
                return (
                  <tr
                    key={res.resourceId}
                    onClick={() => setSelectedResourceId(res.resourceId)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/30 text-purple-950 dark:text-white"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      {res.resourceId}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {res.eventsHandled} events ({res.uniqueCases} cases)
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, res.workloadSharePct * 2)}%` }}
                          />
                        </div>
                        <span className="text-purple-600 dark:text-purple-300 font-bold">
                          {res.workloadSharePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {res.formattedAvgProcessingTime}
                    </td>
                    <td className="py-2.5">
                      {res.isOverloaded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold">
                          <AlertCircle className="h-2.5 w-2.5" />
                          High Workload
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Resource Detail Card */}
        {selectedResource && (
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/10 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-purple-200 dark:border-purple-500/20 mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
                    Inspecting Resource
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedResource.resourceId}
                  </h4>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/40 font-semibold">
                  {selectedResource.workloadRatioToAvg}x Avg Load
                </span>
              </div>

              {/* Overload Signals and Phrasing */}
              {selectedResource.isOverloaded ? (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Observed Associations:
                  </div>
                  {selectedResource.overloadReasons.map((reason, i) => (
                    <p key={i} className="text-[11px] leading-relaxed">
                      • {reason}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Within Balanced Capacity:
                  </span>{" "}
                  Operational workload duration conforms to the normal range across assigned stages.
                </div>
              )}

              {/* Handled stages list */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block font-semibold">
                  Stages Handled:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedResource.stagesHandled.map((st) => (
                    <span
                      key={st}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    >
                      {st}
                    </span>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Work Duration:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">
                      {selectedResource.formattedTotalProcessingTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Processing:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200">
                      {Math.round(selectedResource.medianProcessingTimeMs / 1000)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Associated Queue Delays:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200">
                      {(selectedResource.associatedWaitingTimeMs / 60000).toFixed(0)}m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-purple-200 dark:border-purple-500/20">
              Language standard: Associations denote timestamp correlations, not confirmed causal operator faults.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
