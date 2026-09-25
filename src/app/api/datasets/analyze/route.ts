/**
 * FlowLens AI - Process Analysis API Route
 * Phase 1: Event Data Engine
 *
 * POST /api/datasets/analyze
 * Accepts CSV data via JSON body or FormData file upload.
 * Executes deterministic process mining pipeline and returns structured analytics.
 * Persistence to Supabase PostgreSQL is optional via the 'persist' flag.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeProcess } from "@/backend/engine";
import { ColumnMappingConfig, ProcessDomain } from "@/shared/types";
import {
  createDatasetRecord,
  insertProcessEventsBatch,
} from "@/backend/database";

export async function POST(req: NextRequest) {
  try {
    let csvContent = "";
    let datasetName = "Uploaded Dataset";
    let originalFilename: string | undefined = undefined;
    let shouldPersist = false;

    const contentType = req.headers.get("content-type") || "";

    let columnMapping: ColumnMappingConfig | undefined = undefined;
    let domainOverride: ProcessDomain | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const nameField = formData.get("name");
      const persistField = formData.get("persist");
      const mappingField = formData.get("columnMapping");
      const domainField = formData.get("domainOverride");

      if (file && typeof file === "object" && "text" in file) {
        csvContent = await (file as File).text();
        originalFilename = (file as File).name;
        datasetName = (nameField as string) || (file as File).name;
      } else {
        const textPayload = formData.get("csv");
        if (typeof textPayload === "string") {
          csvContent = textPayload;
        }
      }

      if (persistField === "true" || persistField === "1") {
        shouldPersist = true;
      }
      if (typeof mappingField === "string") {
        try {
          columnMapping = JSON.parse(mappingField);
        } catch {
          // ignore parsing error
        }
      }
      if (typeof domainField === "string") {
        domainOverride = domainField as ProcessDomain;
      }
    } else {
      // Default to JSON body or text
      const body = await req.json().catch(() => ({}));
      csvContent = body.csv || "";
      datasetName = body.datasetName || "Uploaded Dataset";
      originalFilename = body.originalFilename;
      shouldPersist = Boolean(body.persist);
      columnMapping = body.columnMapping;
      domainOverride = body.domainOverride;
    }

    if (!csvContent || !csvContent.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Empty or missing CSV payload. Provide CSV text or a file upload.",
        },
        { status: 400 }
      );
    }

    // 1. Run pure deterministic analysis pipeline with flexible schema & domain support
    const analysis = analyzeProcess(csvContent, {
      datasetName,
      columnMapping,
      domainOverride,
    });

    // 2. Check if fatal validation errors prevented parsing
    if (analysis.datasetSummary.validEventsCount === 0 && analysis.validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV validation failed. No valid process events could be reconstructed.",
          errors: analysis.validationErrors,
          summary: analysis.datasetSummary,
        },
        { status: 422 }
      );
    }

    // 3. Optional persistence to Supabase PostgreSQL (if requested)
    let persistedDatasetId: string | undefined = undefined;
    let persistenceWarning: string | undefined = undefined;

    if (shouldPersist && analysis.cases.length > 0) {
      try {
        const datasetRes = await createDatasetRecord({
          name: datasetName,
          originalFilename: originalFilename || null,
          rowCount: analysis.datasetSummary.validEventsCount,
          caseCount: analysis.datasetSummary.uniqueCasesCount,
        });

        if (datasetRes.data) {
          persistedDatasetId = datasetRes.data.id;

          // Flatten events from cases for insertion
          const eventsToInsert = analysis.cases.flatMap((c) =>
            c.events.map((e) => ({
              datasetId: datasetRes.data!.id,
              caseId: e.caseId,
              activity: e.activity,
              startTime: e.startTime,
              endTime: e.endTime,
              resourceId: e.resourceId,
              status: e.status,
              metadata: e.metadata,
            }))
          );

          await insertProcessEventsBatch(eventsToInsert);
        } else if (datasetRes.error) {
          persistenceWarning = `Persistence skipped: ${datasetRes.error}`;
        }
      } catch (err) {
        persistenceWarning = `Persistence error: ${(err as Error).message}`;
      }
    }

    return NextResponse.json(
      {
        success: true,
        analysis,
        persistedDatasetId,
        persistenceWarning,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal process analysis error occurred.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
