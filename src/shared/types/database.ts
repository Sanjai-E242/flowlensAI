/**
 * FlowLens AI - Supabase Database Schema Types
 * Shared Layer (Browser & Server safe)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      datasets: {
        Row: {
          id: string;
          name: string;
          original_filename: string | null;
          row_count: number;
          case_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          original_filename?: string | null;
          row_count?: number;
          case_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          original_filename?: string | null;
          row_count?: number;
          case_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      process_events: {
        Row: {
          id: string;
          dataset_id: string;
          case_id: string;
          activity: string;
          start_time: string;
          end_time: string;
          resource_id: string | null;
          status: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          case_id: string;
          activity: string;
          start_time: string;
          end_time: string;
          resource_id?: string | null;
          status?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          case_id?: string;
          activity?: string;
          start_time?: string;
          end_time?: string;
          resource_id?: string | null;
          status?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "process_events_dataset_id_fkey";
            columns: ["dataset_id"];
            isOneToOne: false;
            referencedRelation: "datasets";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
