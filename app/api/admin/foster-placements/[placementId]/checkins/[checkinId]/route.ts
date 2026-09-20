import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteFosterCheckin } from "@/lib/foster";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ placementId: string; checkinId: string }> },
) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const { checkinId } = await params;
  await deleteFosterCheckin(supabase, checkinId);
  return NextResponse.json({ ok: true });
}
