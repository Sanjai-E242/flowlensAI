import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types";

/**
 * FlowLens AI - Server-Side Supabase Client
 *
 * For use strictly in Server Components, Route Handlers, and Server Actions.
 * Uses administrative/service capabilities with:
 * - SUPABASE_URL (falls back to NEXT_PUBLIC_SUPABASE_URL if SUPABASE_URL is not set)
 * - SUPABASE_SECRET_KEY
 *
 * This file MUST NEVER be imported by client components or sent to the browser.
 */

export function getServerSupabaseClient(): SupabaseClient<Database> | null {
  // Runtime assertion: ensure this function is never called in the browser
  if (typeof window !== "undefined") {
    throw new Error(
      "Security Exception: getServerSupabaseClient was invoked in a browser environment. Server secrets must never be exposed to the client."
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[FlowLens AI] Supabase server environment variables are missing. Configure SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local."
      );
    }
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
