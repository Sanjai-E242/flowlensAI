/**
 * FlowLens AI - Deterministic CSV Ingestion & Header Normalizer
 * Phase 1: Event Data Engine
 */

import { CANONICAL_ALIASES } from "./constants";
import { ValidationError, ColumnMappingConfig } from "@/shared/types";

export interface ParsedCsvResult {
  headers: string[];
  canonicalMap: Record<string, string>; // e.g. { "Case ID": "case_id", "Stage": "activity" }
  missingRequired: string[];
  rows: Array<{
    record: Record<string, string>;
    rowIndex: number; // 1-based original CSV line number
  }>;
  validationErrors: ValidationError[];
}

/**
 * Normalizes header string for comparison: lowercase, trim, remove hyphens/underscores/spaces.
 */
export function normalizeColumnKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves a CSV header against canonical aliases.
 */
export function matchCanonicalField(header: string): string | null {
  const normalized = normalizeColumnKey(header);

  for (const [canonical, aliases] of Object.entries(CANONICAL_ALIASES)) {
    for (const alias of aliases) {
      if (normalizeColumnKey(alias) === normalized) {
        return canonical;
      }
    }
  }

  return null;
}

/**
 * Robust CSV Line Tokenizer that correctly handles quoted strings, escaped quotes, and delimiters.
 */
export function tokenizeCsvLine(line: string, delimiter = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote: "" -> "
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
      i++;
      continue;
    }

    current += char;
    i++;
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parses raw CSV text into structured records with canonical field mappings.
 * Supports explicit custom column mappings or intelligent automatic alias detection.
 */
export function parseCsvText(
  csvText: string,
  customMapping?: ColumnMappingConfig
): ParsedCsvResult {
  const errors: ValidationError[] = [];

  if (!csvText || !csvText.trim()) {
    errors.push({
      code: "EMPTY_DATASET",
      message: "The provided CSV dataset is empty.",
    });
    return {
      headers: [],
      canonicalMap: {},
      missingRequired: ["case_id", "activity", "start_time", "end_time"],
      rows: [],
      validationErrors: errors,
    };
  }

  // Split lines while respecting potential CRLF and LF
  const rawLines = csvText.split(/\r?\n/);
  const nonEmptyLines: { line: string; lineIndex: number }[] = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx].trim();
    if (line.length > 0) {
      nonEmptyLines.push({ line, lineIndex: idx + 1 });
    }
  }

  if (nonEmptyLines.length === 0) {
    errors.push({
      code: "EMPTY_DATASET",
      message: "The CSV contains no readable lines.",
    });
    return {
      headers: [],
      canonicalMap: {},
      missingRequired: ["case_id", "activity", "start_time", "end_time"],
      rows: [],
      validationErrors: errors,
    };
  }

  // First line is header
  const headerLine = nonEmptyLines[0];
  const rawHeaders = tokenizeCsvLine(headerLine.line);

  // Map headers to canonical names
  const canonicalMap: Record<string, string> = {};
  const recognizedCanonicals = new Set<string>();

  // 1. Apply user custom mappings if provided
  if (customMapping) {
    for (const [canonical, userCol] of Object.entries(customMapping)) {
      if (userCol && rawHeaders.includes(userCol)) {
        canonicalMap[userCol] = canonical;
        recognizedCanonicals.add(canonical);
      }
    }
  }

  // 2. Fall back to automatic alias recognition for unmapped headers
  for (const rawHeader of rawHeaders) {
    if (canonicalMap[rawHeader]) continue;
    const canonical = matchCanonicalField(rawHeader);
    if (canonical && !recognizedCanonicals.has(canonical)) {
      canonicalMap[rawHeader] = canonical;
      recognizedCanonicals.add(canonical);
    }
  }

  // Check required fields
  const requiredFields = ["case_id", "activity", "start_time", "end_time"];
  const missingRequired = requiredFields.filter((req) => !recognizedCanonicals.has(req));

  if (missingRequired.length > 0) {
    errors.push({
      code: "MISSING_REQUIRED_COLUMN",
      message: `Unable to identify required column(s): ${missingRequired.join(
        ", "
      )}. Possible columns detected in CSV: ${rawHeaders.join(
        ", "
      )}. Please verify or adjust your column mapping.`,
    });
  }

  // Parse data rows
  const parsedRows: ParsedCsvResult["rows"] = [];

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const { line, lineIndex } = nonEmptyLines[i];
    const values = tokenizeCsvLine(line);

    // Skip empty lines that might have remained
    if (values.length === 1 && values[0] === "") continue;

    if (values.length !== rawHeaders.length) {
      errors.push({
        rowIndex: lineIndex,
        code: "CORRUPT_ROW",
        message: `Row ${lineIndex} column count mismatch: expected ${rawHeaders.length} columns, found ${values.length}.`,
      });
      continue;
    }

    const record: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      const canonicalName = canonicalMap[headerName];
      const cellValue = values[c];

      // Assign to canonical name if mapped, else keep raw header
      if (canonicalName) {
        record[canonicalName] = cellValue;
      }
      record[headerName] = cellValue;
    }

    parsedRows.push({
      record,
      rowIndex: lineIndex,
    });
  }

  return {
    headers: rawHeaders,
    canonicalMap,
    missingRequired,
    rows: parsedRows,
    validationErrors: errors,
  };
}
