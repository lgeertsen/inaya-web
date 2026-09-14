"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
    <Container className="py-24 max-w-[420px]!">
      <Card className="p-8 hover:shadow-card hover:translate-y-0">
        <h1 className="text-2xl mb-6">{t("title")}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("password")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-accent">{t("error")}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "…" : t("submit")}
          </Button>
        </form>
      </Card>
    </Container>
  );
}
