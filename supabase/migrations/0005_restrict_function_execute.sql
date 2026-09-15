-- 0004 left current_role() and handle_new_user() callable directly via the
-- PostgREST RPC API (/rest/v1/rpc/...) — the security advisor flagged both.
-- Neither is meant to be called that way: current_role() exists only for use
-- inside RLS policies (still needs EXECUTE for `authenticated`, since policy
-- evaluation runs as the querying role), and handle_new_user() is a trigger
-- function only ever invoked by on_auth_user_created (trigger firing doesn't
-- require the triggering session to hold EXECUTE on the function).
--
-- Supabase's default privileges on the public schema grant EXECUTE directly
-- to the anon/authenticated/service_role roles (not to the PUBLIC
-- pseudo-role), so `revoke ... from public` is a no-op here — the named
-- roles must be revoked explicitly.

revoke execute on function public.current_role() from anon, authenticated;
grant execute on function public.current_role() to authenticated;

revoke execute on function public.handle_new_user() from anon, authenticated;
