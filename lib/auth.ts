import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export type Role = "admin" | "volunteer";

type RequireAdminResult =
  | { user: User; supabase: SupabaseClient; response: null }
  | { user: null; supabase: SupabaseClient; response: NextResponse };

async function getSessionRole(): Promise<{
  user: User | null;
  supabase: SupabaseClient;
  role: Role | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, supabase, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, supabase, role: (profile?.role as Role | undefined) ?? "volunteer" };
}

/**
 * Re-verifies the session inside a Route Handler, as defense in depth beyond
 * the proxy's route gate. Requires the `admin` role — accounts are
 * provisioned manually (see the Supabase Auth dashboard, no public sign-up
 * exists) and default to the more restricted `volunteer` role; promoting one
 * to admin is a manual `update profiles set role = 'admin' ...`.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const { user, supabase, role } = await getSessionRole();

  if (!user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (role !== "admin") {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, supabase, response: null };
}

/** Like requireAdmin(), but accepts any signed-in staff account (admin or volunteer). */
export async function requireStaff(): Promise<RequireAdminResult> {
  const { user, supabase } = await getSessionRole();

  if (!user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, response: null };
}

/**
 * For Server Components/layouts under /admin: returns the signed-in user's
 * role, or null if signed out. The proxy route gate already keeps signed-out
 * visitors out of /admin, so null here is only an edge case (e.g. a profile
 * row missing) — treat it the same as the more restricted `volunteer` role.
 */
export async function getPageRole(): Promise<Role | null> {
  const { role } = await getSessionRole();
  return role;
}
