import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { contactFormSchema } from "@/lib/validation";

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL ?? "inaya.farm@gmail.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = contactFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { firstName, lastName, email, subject, message } = parsed.data;

  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Inaya Farm <onboarding@resend.dev>",
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `[Inaya.farm] ${subject}`,
      text: `${message}\n\n—\n${firstName} ${lastName}\n${email}`,
    });

    if (error) {
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
