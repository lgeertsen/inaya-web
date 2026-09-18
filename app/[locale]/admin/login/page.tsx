"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AdminInput, AdminLabel } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(false);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(true);
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    // Full navigation (not client-side router) so the freshly-set session
    // cookie is present on the next server request to the protected route.
    window.location.href = next && next.includes("/admin") ? next : `/${locale}/admin/animals`;
  }

  return (
    <div className="admin-scope flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[380px] flex-col gap-[18px] rounded-admin border border-ink/10 bg-surface p-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent font-display text-[15px] font-extrabold text-white">
            I
          </div>
          <div className="flex flex-col leading-[1.15]">
            <span className="font-display text-base font-extrabold tracking-tight">Inaya</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink/50">
              Administration
            </span>
          </div>
        </div>

        <h2 className="text-xl">{t("title")}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-[5px]">
            <AdminLabel>{t("email")}</AdminLabel>
            <AdminInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <AdminLabel>{t("password")}</AdminLabel>
            <AdminInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-danger">{t("error")}</p> : null}
          <AdminButton type="submit" variant="dark" disabled={loading} className="w-full justify-center py-2.5 text-[13.5px]">
            {loading ? "…" : t("submit")}
          </AdminButton>
        </form>

        <p className="text-[11.5px] leading-[1.5] text-ink/50">{t("footer")}</p>
      </div>
    </div>
  );
}
