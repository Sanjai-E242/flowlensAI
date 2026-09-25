"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  X,
  AlertTriangle,
  ArrowRight,
  FileCheck2,
  Settings2,
  CheckCircle2,
  Building,
  Truck,
  Landmark,
  Headphones,
  Stethoscope,
  Cpu,
} from "lucide-react";
import {
  DEMO_PRESETS,
  DemoDatasetPreset,
} from "@/data/industry-datasets";
import {
  profileCsvSchema,
} from "@/backend/engine/schema-profiler";
import {
  ColumnMappingConfig,
  ProcessDomain,
  SchemaProfileResult,
} from "@/shared/types";

interface DatasetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (
    csvText: string,
    datasetName: string,
    persist: boolean,
    columnMapping?: ColumnMappingConfig,
    domainOverride?: ProcessDomain
  ) => Promise<void>;
  isAnalyzing: boolean;
}

const ALL_DOMAINS: ProcessDomain[] = [
  "General Operations",
  "Manufacturing",
  "Logistics",
  "Banking",
  "Customer Operations",
  "Healthcare",
  "E-commerce",
  "Insurance",
  "Enterprise Operations",
  "Supply Chain",
];

export function DatasetUploadModal({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}: DatasetUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "presets">("presets");
  const [csvText, setCsvText] = useState("");
  const [datasetName, setDatasetName] = useState("Universal Process Log");
  const [persistToSupabase, setPersistToSupabase] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Column Mapping state
  const [customMapping, setCustomMapping] = useState<ColumnMappingConfig>({});
  const [domainOverride, setDomainOverride] = useState<ProcessDomain | null>(null);
  const [showMappingConfig, setShowMappingConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute profile whenever csvText or customMapping changes
  const profile: SchemaProfileResult | null = useMemo(() => {
    if (!csvText || !csvText.trim()) return null;
    return profileCsvSchema(csvText, customMapping);
  }, [csvText, customMapping]);

  const selectedDomain: ProcessDomain =
    domainOverride || profile?.detectedDomain.domain || "General Operations";

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setLocalError(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      setLocalError("Please select a valid CSV file (.csv).");
      return;
    }

    setFileName(file.name);
    setFileSizeBytes(file.size);
    setDatasetName(file.name.replace(/\.csv$/i, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCsvText(content);
        setCustomMapping({});
        setShowMappingConfig(true);
      }
    };
    reader.onerror = () => {
      setLocalError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const loadPreset = (preset: DemoDatasetPreset) => {
    setCsvText(preset.csv);
    setDatasetName(preset.name);
    setFileName(`${preset.id}-log.csv`);
    setFileSizeBytes(preset.csv.length);
    setDomainOverride(preset.domain as ProcessDomain);
    setCustomMapping({});
    setShowMappingConfig(true);
    setLocalError(null);
  };

  const handleMappingChange = (field: keyof ColumnMappingConfig, column: string) => {
    setCustomMapping((prev) => ({
      ...prev,
      [field]: column === "NONE" ? undefined : column,
    }));
  };

  const handleStartAnalysis = async () => {
    if (!csvText.trim()) {
      setLocalError("Please provide CSV content or select a demo dataset.");
      return;
    }

    if (profile && !profile.isValid) {
      const missing = profile.missingRequiredColumns;
      let msg = "Unable to analyze this file. Required process information could not be detected.";
      if (missing.includes("caseId")) {
        msg = "Choose the column that identifies each process case.";
      } else if (missing.includes("startTime") || missing.includes("endTime")) {
        msg = "Start and end timestamps are required to reconstruct process duration.";
      } else {
        msg = `Unable to analyze this file. Required process information could not be detected: missing ${missing.join(", ")}.`;
      }
      setLocalError(msg);
      setShowMappingConfig(true);
      return;
    }

    setLocalError(null);
    try {
      await onAnalyze(
        csvText,
        datasetName,
        persistToSupabase,
        customMapping,
        selectedDomain
      );
      onClose();
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to analyze dataset."
      );
    }
  };

  const getDomainIcon = (d: string) => {
    switch (d) {
      case "Manufacturing":
        return <Cpu className="h-4 w-4" />;
      case "Logistics":
        return <Truck className="h-4 w-4" />;
      case "Banking":
        return <Landmark className="h-4 w-4" />;
      case "Customer Operations":
        return <Headphones className="h-4 w-4" />;
      case "Healthcare":
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Universal Process Ingestion & Mapping
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload any process event-log CSV from any industry or explore verified presets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                activeTab === "presets"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Industry Demo Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                activeTab === "file"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Upload CSV File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                activeTab === "paste"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Paste Raw CSV
            </button>
          </div>

          {/* Tab 1: Industry Demo Presets */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select an industry event-log demonstration:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadPreset(preset)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {getDomainIcon(preset.domain)}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {preset.name}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: File Upload Dropzone */}
          {activeTab === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <UploadCloud className="h-10 w-10 text-indigo-500 mx-auto mb-2 opacity-90" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drop your CSV event-log here, or{" "}
                <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">
                  Browse Files
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports flexible columns across Manufacturing, Logistics, Banking, Healthcare, etc.
              </p>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>{fileName}</span>
                  {fileSizeBytes && (
                    <span className="opacity-60 text-[10px]">
                      ({Math.round(fileSizeBytes / 1024)} KB)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Paste Raw CSV */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste CSV Text (with headers on first line):
              </label>
              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setFileName(null);
                  setShowMappingConfig(true);
                }}
                rows={6}
                placeholder="case_id,activity,start_time,end_time,resource_id,priority&#10;ORD_1,Cutting,2026-09-01 08:00,2026-09-01 08:30,M1,High&#10;ORD_1,Milling,2026-09-01 09:00,2026-09-01 10:15,M2,High"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* Schema Profile & Column Mapping Panel */}
          {profile && profile.headers.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {getDomainIcon(selectedDomain)}
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Dataset Profile: ~{profile.estimatedTotalRows} Rows, {profile.headers.length} Columns
                  </div>
                </div>

                {/* Domain Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Domain:
                  </span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setDomainOverride(e.target.value as ProcessDomain)}
                    className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-1"
                  >
                    {ALL_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
                    Verified Column Roles
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMappingConfig(!showMappingConfig)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {showMappingConfig ? "Collapse Roles" : "Adjust Roles"}
                  </button>
                </div>

                {showMappingConfig && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                    {/* Case ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Case Identifier <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={customMapping.case_id || profile.detectedMappings.case_id || ""}
                        onChange={(e) => handleMappingChange("case_id", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="">-- Select Column --</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Activity / Stage */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Activity / Stage <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={customMapping.activity || profile.detectedMappings.activity || ""}
                        onChange={(e) => handleMappingChange("activity", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="">-- Select Column --</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Start Timestamp <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={customMapping.start_time || profile.detectedMappings.start_time || ""}
                        onChange={(e) => handleMappingChange("start_time", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="">-- Select Column --</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        End Timestamp <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={customMapping.end_time || profile.detectedMappings.end_time || ""}
                        onChange={(e) => handleMappingChange("end_time", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="">-- Select Column --</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Resource ID (optional) */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Resource (Optional)
                      </label>
                      <select
                        value={customMapping.resource_id || profile.detectedMappings.resource_id || "NONE"}
                        onChange={(e) => handleMappingChange("resource_id", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="NONE">(None)</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority (optional) */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Priority (Optional)
                      </label>
                      <select
                        value={customMapping.priority || profile.detectedMappings.priority || "NONE"}
                        onChange={(e) => handleMappingChange("priority", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="NONE">(None)</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location / Department (optional) */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Location / Dept (Optional)
                      </label>
                      <select
                        value={customMapping.location || profile.detectedMappings.location || "NONE"}
                        onChange={(e) => handleMappingChange("location", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="NONE">(None)</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status (optional) */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Status (Optional)
                      </label>
                      <select
                        value={customMapping.status || profile.detectedMappings.status || "NONE"}
                        onChange={(e) => handleMappingChange("status", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 text-xs"
                      >
                        <option value="NONE">(None)</option>
                        {profile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dataset Name Input & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g. Laser CNC Fabrication Log"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={persistToSupabase}
                  onChange={(e) => setPersistToSupabase(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Persist to Cloud Repository (Supabase)
                </span>
              </label>
            </div>
          </div>

          {/* Local Error Banner */}
          {localError && (
            <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {profile?.isValid ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Schema valid & ready for analysis
              </span>
            ) : (
              <span>Provide CSV with Case ID, Activity, and Timestamps.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !csvText.trim()}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reconstructing Process...</span>
                </>
              ) : (
                <>
                  <span>Run Universal Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
