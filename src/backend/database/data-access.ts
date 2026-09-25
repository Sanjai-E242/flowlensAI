/**
 * FlowLens AI - Server-Side Data Access Layer
 * Backend Database Layer
 *
 * Encapsulates all persistence operations for datasets and process events.
 * Strictly executes on the server side using the server Supabase client.
 */

import { getServerSupabaseClient } from "./server";
import { Database, Json } from "@/shared/types";

export type DatasetRow = Database["public"]["Tables"]["datasets"]["Row"];
export type ProcessEventRow = Database["public"]["Tables"]["process_events"]["Row"];

export interface CreateDatasetParams {
  name: string;
  originalFilename?: string | null;
  rowCount: number;
  caseCount: number;
}

export interface InsertEventParams {
  datasetId: string;
  caseId: string;
  activity: string;
  startTime: string;
  endTime: string;
  resourceId?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Creates a new dataset record in the database.
 */
export async function createDatasetRecord(
  params: CreateDatasetParams
): Promise<{ data: DatasetRow | null; error: string | null }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { data: null, error: "Supabase server client is not configured." };
  }

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      name: params.name,
      original_filename: params.originalFilename || null,
      row_count: params.rowCount,
      case_count: params.caseCount,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Batch inserts process events for a given dataset.
 * Uses batch chunks to ensure large datasets insert reliably.
 */
export async function insertProcessEventsBatch(
  events: InsertEventParams[],
  batchSize: number = 250
): Promise<{ insertedCount: number; error: string | null }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { insertedCount: 0, error: "Supabase server client is not configured." };
  }

  if (events.length === 0) {
    return { insertedCount: 0, error: null };
  }

  let totalInserted = 0;

  for (let i = 0; i < events.length; i += batchSize) {
    const chunk = events.slice(i, i + batchSize).map((e) => ({
      dataset_id: e.datasetId,
      case_id: e.caseId,
      activity: e.activity,
      start_time: e.startTime,
      end_time: e.endTime,
      resource_id: e.resourceId || null,
      status: e.status || null,
      metadata: (e.metadata as Json) || null,
    }));

    const { data, error } = await supabase
      .from("process_events")
      .insert(chunk)
      .select("id");

    if (error) {
      return {
        insertedCount: totalInserted,
        error: `Batch insert error at index ${i}: ${error.message}`,
      };
    }

    totalInserted += data ? data.length : chunk.length;
  }

  return { insertedCount: totalInserted, error: null };
}

/**
 * Retrieves a dataset record by ID.
 */
export async function getDatasetById(
  id: string
): Promise<{ data: DatasetRow | null; error: string | null }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { data: null, error: "Supabase server client is not configured." };
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Retrieves all events associated with a specific dataset ID.
 */
export async function getProcessEventsByDatasetId(
  datasetId: string
): Promise<{ data: ProcessEventRow[]; error: string | null }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { data: [], error: "Supabase server client is not configured." };
  }

  const { data, error } = await supabase
    .from("process_events")
    .select("*")
    .eq("dataset_id", datasetId)
    .order("start_time", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

/**
 * Lists the most recently uploaded datasets.
 */
export async function listRecentDatasets(
  limit: number = 20
): Promise<{ data: DatasetRow[]; error: string | null }> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { data: [], error: "Supabase server client is not configured." };
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}
