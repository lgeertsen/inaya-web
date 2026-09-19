import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { checkAgainstDefault, type SiteTextProblem } from "@/lib/icu";
import { getDefaultText } from "@/lib/site-text-catalog";
import { SITE_TEXTS_TAG } from "@/lib/site-texts";
import { saveSiteTextsSchema } from "@/lib/validation";

type FieldError = SiteTextProblem | "unknown_key";

/** Makes the public (statically generated) pages pick up the change on their next visit. */
function revalidatePublicSite() {
  revalidateTag(SITE_TEXTS_TAG, { expire: 0 });
  revalidatePath("/[locale]", "layout");
}

// Saves one or more edited texts for a locale. A text equal to the shipped
// default is stored as "no override" (row deleted) so a later change to the
// default isn't hidden by a stale copy — this is also how "restore original" works.
export async function PUT(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const parsed = saveSiteTextsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { locale, changes } = parsed.data;

  const errors: Record<string, FieldError> = {};
  const toUpsert: { locale: string; key: string; value: string; updated_by: string }[] = [];
  const toDelete: string[] = [];

  for (const { key, value } of changes) {
    const shipped = getDefaultText(locale, key);
    if (shipped === undefined) {
      errors[key] = "unknown_key";
      continue;
    }
    const problem = checkAgainstDefault(value, shipped);
    if (problem) {
      errors[key] = problem;
      continue;
    }
    if (value === shipped) toDelete.push(key);
    else toUpsert.push({ locale, key, value, updated_by: user.id });
  }

  // All-or-nothing: don't half-apply a batch the admin will see as failed.
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase.from("site_texts").upsert(toUpsert, { onConflict: "locale,key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from("site_texts").delete().eq("locale", locale).in("key", toDelete);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicSite();
  return NextResponse.json({ ok: true, saved: changes.length });
}
