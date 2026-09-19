"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye, RotateCcw, Undo2 } from "lucide-react";
import { AdminTextarea } from "@/components/admin/ui/AdminField";
import { StatusPill } from "@/components/admin/ui/StatusPill";
import { getPlaceholders } from "@/lib/icu";
import type { CatalogEntry } from "@/lib/site-text-catalog";
import type { SiteTextLocale } from "@/lib/site-texts";
import type { KeyLocation } from "./preview-controller";

export type FieldProblem = "empty" | "invalid" | "tags" | "placeholders" | "unknown_key";

interface TextFieldProps {
  entry: CatalogEntry;
  locale: SiteTextLocale;
  /** Text currently in the box (draft if any, else saved). */
  value: string;
  location: KeyLocation | undefined;
  isSelected: boolean;
  isHovered: boolean;
  problem: FieldProblem | null;
  onChange: (value: string) => void;
  onFocus: () => void;
  onHover: (hovered: boolean) => void;
  onUndo: () => void;
  onResetToDefault: () => void;
}

export function TextField({
  entry,
  locale,
  value,
  location,
  isSelected,
  isHovered,
  problem,
  onChange,
  onFocus,
  onHover,
  onUndo,
  onResetToDefault,
}: TextFieldProps) {
  const t = useTranslations("admin.texts");
  const own = entry[locale];
  const otherLocale: SiteTextLocale = locale === "fr" ? "en" : "fr";

  const hasDraft = value !== own.value;
  const differsFromDefault = value !== own.default;

  const placeholders = useMemo(() => {
    try {
      return Array.from(getPlaceholders(own.default).keys());
    } catch {
      return [];
    }
  }, [own.default]);

  return (
    <div
      id={`field-${entry.key}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`flex flex-col gap-2.5 rounded-admin border bg-surface p-3.5 transition-shadow ${
        isSelected
          ? "border-accent shadow-[0_0_0_3px_var(--color-accent-bg)]"
          : isHovered
            ? "border-accent/55"
            : "border-ink/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[12.5px] font-bold">
          {location ? t(`roles.${location.role}`) : t("roles.other")}
        </span>
        {location ? (
          <StatusPill tone="neutral">{t(`regions.${location.region}`)}</StatusPill>
        ) : null}
        <span className="ml-auto flex items-center gap-1.5">
          {hasDraft ? <StatusPill tone="warning">{t("field.unsaved")}</StatusPill> : null}
          {!hasDraft && differsFromDefault ? <StatusPill tone="accent">{t("field.modified")}</StatusPill> : null}
        </span>
      </div>

      {location?.heading ? (
        <p className="-mt-1 text-[11.5px] text-ink/55">{t("field.under", { heading: location.heading })}</p>
      ) : null}

      <AdminTextarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        rows={1}
        aria-label={entry.key}
        aria-invalid={problem ? true : undefined}
        className={`field-sizing-content min-h-[42px] !resize-none leading-relaxed ${
          problem ? "border-danger focus:border-danger" : ""
        }`}
      />

      {problem ? (
        <p role="alert" className="text-[12px] font-bold text-danger">
          {problem === "placeholders"
            ? t("problems.placeholders", { names: placeholders.map((name) => `{${name}}`).join(" ") })
            : t(`problems.${problem}`)}
        </p>
      ) : null}

      {placeholders.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink/60">
          {t("field.variables")}
          {placeholders.map((name) => (
            <code key={name} className="rounded-md bg-ink/6 px-1.5 py-0.5 font-mono text-[11px]">{`{${name}}`}</code>
          ))}
        </p>
      ) : null}

      {location?.hasPlaceholders && location.visible ? (
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink/55">
          <Eye size={13} className="flex-none" />
          {t("field.previewAfterSave")}
        </p>
      ) : null}

      {location && location.sharedWith.length > 0 ? (
        <p className="text-[11.5px] text-ink/55">
          {t("field.sharedWith", { keys: location.sharedWith.join(", ") })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink/8 pt-2.5">
        <code className="font-mono text-[10.5px] text-ink/45">{entry.key}</code>
        <span className="ml-auto flex flex-wrap items-center gap-3">
          {hasDraft ? (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-bold text-ink/65 hover:text-ink"
            >
              <Undo2 size={13} />
              {t("field.undo")}
            </button>
          ) : null}
          {differsFromDefault ? (
            <button
              type="button"
              onClick={onResetToDefault}
              className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-bold text-ink/65 hover:text-accent"
            >
              <RotateCcw size={13} />
              {t("field.resetToOriginal")}
            </button>
          ) : null}
        </span>
      </div>

      <details className="group text-[12px] text-ink/60">
        <summary className="cursor-pointer select-none font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45 hover:text-ink/70">
          {t("field.moreInfo")}
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45">
              {t("field.original")}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-ink/[0.04] px-2.5 py-1.5 leading-relaxed">
              {own.default}
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45">
              {t("field.otherLanguage", { language: t(`languages.${otherLocale}`) })}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-ink/[0.04] px-2.5 py-1.5 leading-relaxed">
              {entry[otherLocale].value}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
