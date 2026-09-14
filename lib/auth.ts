import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

type RequireAdminResult =
  | { user: User; supabase: SupabaseClient; response: null }
  | { user: null; supabase: SupabaseClient; response: NextResponse };

/**
 * Re-verifies the session inside a Route Handler, as defense in depth
 * beyond the middleware's route gate. Any authenticated Supabase user is
 * treated as an admin (accounts are provisioned manually — see the
 * Supabase Auth dashboard, no public sign-up exists).
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, response: null };
}
