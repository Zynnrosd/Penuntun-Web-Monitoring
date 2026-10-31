// backend/src/lib/supabase.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const opsi = { auth: { persistSession: false, autoRefreshToken: false } };

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opsi);

export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, opsi);

export function supabaseSebagai(token: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...opsi,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}