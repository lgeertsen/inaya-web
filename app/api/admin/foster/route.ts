import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fosterFamilyFormSchema } from "@/lib/validation";
import { createFosterFamily, hasPgErrorCode, PG_UNIQUE_VIOLATION } from "@/lib/foster";

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json();
  const parsed = fosterFamilyFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const family = await createFosterFamily(supabase, parsed.data);
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    // The linked volunteer account already belongs to another family.
    if (hasPgErrorCode(error, PG_UNIQUE_VIOLATION)) {
      return NextResponse.json({ error: "account_already_linked" }, { status: 409 });
    }
    throw error;
  }
}
