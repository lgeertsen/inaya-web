import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security. Server-only: never
// import this from a Client Component or expose the service-role key to
// the browser. Used by the Stripe webhook handler (no user session to
// authenticate the write with) and by the volunteer-account admin routes
// (app/api/admin/accounts/**, lib/accounts.ts), which need the Auth admin
// API to create/list/delete auth.users rows — not reachable through the
// regular RLS-backed client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
