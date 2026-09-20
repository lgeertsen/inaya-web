import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { getRegisterData } from "@/lib/register";
import { renderRegisterPdf, type RegisterTranslator } from "@/lib/register-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await requireAdmin();
  if (!user) return response;

  const year = Number(request.nextUrl.searchParams.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  // The register is a French document, whatever language the admin browses in.
  const t = (await getTranslations({ locale: "fr", namespace: "admin.register" })) as unknown as RegisterTranslator;

  const data = await getRegisterData(supabase, year);
  const pdf = renderRegisterPdf(data, t);

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Entrees-sorties-animaux-${year}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
