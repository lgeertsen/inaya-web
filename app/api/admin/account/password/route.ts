import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireStaff();
  if (!user) return response;

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
