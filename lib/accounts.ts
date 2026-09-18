import type { SupabaseClient } from "@supabase/supabase-js";

export interface VolunteerAccount {
  id: string;
  email: string;
  createdAt: string;
  lastActiveAt: string | null;
}

// adminClient must be the service-role client (lib/supabase/admin.ts) —
// auth.users isn't exposed through the regular PostgREST/RLS-backed client,
// so listing/creating/deleting accounts always goes through the Auth admin
// API, which requires the service-role key.
export async function listVolunteerAccounts(
  adminClient: SupabaseClient,
): Promise<VolunteerAccount[]> {
  const [{ data: userList, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      adminClient.auth.admin.listUsers(),
      adminClient.from("profiles").select("id, role, last_active_at"),
    ]);
  if (usersError) throw usersError;
  if (profilesError) throw profilesError;

  const volunteerProfiles = new Map(
    (profiles ?? []).filter((p) => p.role === "volunteer").map((p) => [p.id, p]),
  );

  return userList.users
    .filter((u) => volunteerProfiles.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastActiveAt: volunteerProfiles.get(u.id)?.last_active_at ?? null,
    }))
    .sort((a, b) => (a.email < b.email ? -1 : 1));
}

export async function createVolunteerAccount(
  adminClient: SupabaseClient,
  email: string,
  password: string,
): Promise<VolunteerAccount> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  // The on_auth_user_created trigger (0004_volunteer_accounts.sql) inserts
  // the matching profiles row, defaulted to role = 'volunteer'.
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    createdAt: data.user.created_at,
    lastActiveAt: null,
  };
}

// Resolves auth.users emails for a set of user ids — e.g. to show who
// uploaded a given animal photo (animal_photos.uploaded_by). Only the
// service-role client can read auth.users, so this always needs adminClient,
// same as the other lookups in this file.
export async function getUserEmailsByIds(
  adminClient: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw error;

  const idSet = new Set(ids);
  return new Map(
    data.users.filter((u) => idSet.has(u.id)).map((u) => [u.id, u.email ?? ""]),
  );
}

// Only ever deletes accounts with role = 'volunteer' — this feature manages
// volunteer accounts specifically, admin accounts stay a manual SQL-editor
// operation (see CLAUDE.md), and this guard keeps a stray/misused DELETE
// call from being able to remove an admin account.
export async function deleteVolunteerAccount(
  adminClient: SupabaseClient,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: "not_a_volunteer" }> {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.role !== "volunteer") {
    return { ok: false, reason: "not_a_volunteer" };
  }

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw error;
  return { ok: true };
}
