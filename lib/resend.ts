import { Resend } from "resend";

let resendClient: Resend | null = null;

// Lazily constructed so importing this module (e.g. during `next build`'s
// route analysis) never requires RESEND_API_KEY to be set — only calling a
// route handler that actually sends an email does.
export function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
