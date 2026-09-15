import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVolunteerAccount } from "@/lib/accounts";
import { createVolunteerAccountSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json();
  const parsed = createVolunteerAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const account = await createVolunteerAccount(
      createAdminClient(),
      parsed.data.email,
      parsed.data.password,
    );
    return NextResponse.json(account);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
