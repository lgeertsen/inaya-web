import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteVolunteerAccount } from "@/lib/accounts";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const result = await deleteVolunteerAccount(createAdminClient(), id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
