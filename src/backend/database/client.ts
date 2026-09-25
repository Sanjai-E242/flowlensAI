import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types";

/**
 * FlowLens AI - Browser Supabase Client
 *
 * For use in client components and browser environments.
 * Uses only public, safe environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * NEVER import server secrets (SUPABASE_SECRET_KEY, GEMINI_API_KEY) into this file.
 */

let browserClient: SupabaseClient<Database> | null = null;

export function getBrowserSupabaseClient(): SupabaseClient<Database> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[FlowLens AI] Supabase browser environment variables are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
      );
    }
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}
