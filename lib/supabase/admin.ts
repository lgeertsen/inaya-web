import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security. Server-only: never
// import this from a Client Component or expose the service-role key to
// the browser. Used only by the Stripe webhook handler, which has no
// user session to authenticate the write with.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
