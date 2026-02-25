import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Lazy singleton — avoids crashing during Next.js static build when env vars are absent
let _client: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      _client = createClient(supabaseUrl, supabaseKey);
    }
    return (_client as any)[prop];
  },
});

export function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL || supabaseUrl,
    process.env.SUPABASE_KEY || supabaseKey,
    { auth: { persistSession: false } }
  );
}
