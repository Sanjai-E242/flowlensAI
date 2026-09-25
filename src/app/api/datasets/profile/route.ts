/**
 * FlowLens AI - Universal Dataset Profiling API
 * POST /api/datasets/profile
 * Analyzes CSV headers, samples rows, suggests column mappings, and detects process domain
 */

import { NextRequest, NextResponse } from "next/server";
import { profileCsvSchema } from "@/backend/engine";
import { ColumnMappingConfig } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let csvContent = "";
    let userMapping: ColumnMappingConfig | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (file && typeof file === "object" && "text" in file) {
        csvContent = await (file as File).text();
      } else {
        const textPayload = formData.get("csv");
        if (typeof textPayload === "string") {
          csvContent = textPayload;
        }
      }
    } else {
      const body = await req.json().catch(() => ({}));
      csvContent = body.csv || "";
      userMapping = body.columnMapping;
    }

    if (!csvContent || !csvContent.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Empty or missing CSV payload.",
        },
        { status: 400 }
      );
    }

    const profile = profileCsvSchema(csvContent, userMapping);

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to profile CSV schema.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
