import { createClient } from "@supabase/supabase-js";

// Cookie-free, anon-key client for reading public data during static
// rendering (e.g. site text overrides loaded from i18n/request.ts). Unlike
// `server.ts`, it never touches `cookies()`, so using it does not opt the
// page into dynamic rendering. Only RLS-public tables are readable with it.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
