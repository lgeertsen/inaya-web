import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { volunteerApplicationSchema } from "@/lib/validation";

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL ?? "inaya.farm@gmail.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = volunteerApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, availability, message } = parsed.data;

  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Inaya Farm <onboarding@resend.dev>",
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `[Inaya.farm] Demande de bénévolat — ${firstName} ${lastName}`,
      text: `${message}\n\n—\n${firstName} ${lastName}\n${email}\n${phone}\nDisponibilités : ${availability}`,
    });

    if (error) {
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
