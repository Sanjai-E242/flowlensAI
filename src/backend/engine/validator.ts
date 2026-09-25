/**
 * FlowLens AI - Event Row Validator & Normalizer
 * Phase 1: Event Data Engine
 */

import { NormalizedEvent, ValidationError } from "@/shared/types";
import { parseDeterministicTimestamp } from "./time-utils";

export interface ValidationOutput {
  validEvents: NormalizedEvent[];
  validationErrors: ValidationError[];
}

/**
 * Validates parsed rows and normalizes valid records into Canonical NormalizedEvent objects.
 */
export function validateAndNormalizeRows(
  rows: Array<{ record: Record<string, string>; rowIndex: number }>
): ValidationOutput {
  const validEvents: NormalizedEvent[] = [];
  const validationErrors: ValidationError[] = [];
  const seenEventSignatures = new Set<string>();

  for (const { record, rowIndex } of rows) {
    // 1. Check Case ID
    const caseId = record["case_id"]?.trim();
    if (!caseId) {
      validationErrors.push({
        rowIndex,
        column: "case_id",
        code: "MISSING_CASE_ID",
        message: `Row ${rowIndex}: Missing required Case ID.`,
      });
      continue;
    }

    // 2. Check Activity / Stage
    const activity = record["activity"]?.trim();
    if (!activity) {
      validationErrors.push({
        rowIndex,
        column: "activity",
        code: "MISSING_ACTIVITY",
        message: `Row ${rowIndex}: Missing required Activity/Stage name.`,
      });
      continue;
    }

    // 3. Parse Start Time
    const rawStartTime = record["start_time"];
    const parsedStart = parseDeterministicTimestamp(rawStartTime);
    if (!parsedStart) {
      validationErrors.push({
        rowIndex,
        column: "start_time",
        value: rawStartTime,
        code: "INVALID_TIMESTAMP",
        message: `Row ${rowIndex}: Unparseable start_time timestamp "${rawStartTime}".`,
      });
      continue;
    }

    // 4. Parse End Time
    const rawEndTime = record["end_time"];
    const parsedEnd = parseDeterministicTimestamp(rawEndTime);
    if (!parsedEnd) {
      validationErrors.push({
        rowIndex,
        column: "end_time",
        value: rawEndTime,
        code: "INVALID_TIMESTAMP",
        message: `Row ${rowIndex}: Unparseable end_time timestamp "${rawEndTime}".`,
      });
      continue;
    }

    // 5. Verify start_time <= end_time
    if (parsedEnd.timestamp < parsedStart.timestamp) {
      validationErrors.push({
        rowIndex,
        code: "END_BEFORE_START",
        message: `Row ${rowIndex}: end_time (${parsedEnd.iso}) occurs before start_time (${parsedStart.iso}).`,
      });
      continue;
    }

    // 6. Check for duplicate identical events
    const signature = `${caseId}|${activity}|${parsedStart.timestamp}|${parsedEnd.timestamp}`;
    if (seenEventSignatures.has(signature)) {
      validationErrors.push({
        rowIndex,
        code: "DUPLICATE_EVENT",
        message: `Row ${rowIndex}: Duplicate event detected for Case "${caseId}" and Activity "${activity}".`,
      });
      continue;
    }
    seenEventSignatures.add(signature);

    const processingTimeMs = parsedEnd.timestamp - parsedStart.timestamp;

    // Optional fields
    const resourceId = record["resource_id"]?.trim() || undefined;
    const status = record["status"]?.trim() || undefined;
    const location = record["location"]?.trim() || undefined;
    const priority = record["priority"]?.trim() || undefined;

    // Additional metadata: any extra columns present that are not canonical
    const metadata: Record<string, unknown> = {};
    const canonicalKeys = new Set([
      "case_id",
      "activity",
      "start_time",
      "end_time",
      "resource_id",
      "status",
      "location",
      "priority",
    ]);

    for (const [key, val] of Object.entries(record)) {
      if (!canonicalKeys.has(key)) {
        metadata[key] = val;
      }
    }

    validEvents.push({
      caseId,
      activity,
      startTime: parsedStart.iso,
      endTime: parsedEnd.iso,
      startTimestamp: parsedStart.timestamp,
      endTimestamp: parsedEnd.timestamp,
      processingTimeMs,
      waitingTimeMs: 0, // Populated during Case Reconstruction
      resourceId,
      status,
      location,
      priority,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      rowIndex,
    });
  }

  return {
    validEvents,
    validationErrors,
  };
}
