"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Crosshair, ExternalLink, ImageIcon, Trash2, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { AdminButton } from "./ui/AdminButton";
import { FocalPointPicker } from "./ui/FocalPointPicker";

export interface SiteImageSlotView {
  id: string;
  /** Caption of the photo that belongs here (the slot's alt text). */
  label: string;
  /** Human description of the box's shape, e.g. "Format 4:3". */
  shape: string;
  image: { url: string; focalX: number; focalY: number; updatedLabel: string } | null;
}

export interface SiteImageGroupView {
  pageId: string;
  pageName: string;
  /** Public URL of the page, so the admin can see where the photos appear. */
  pagePath: string;
  slots: SiteImageSlotView[];
}

export interface SiteImageManagerLabels {
  empty: string;
  upload: string;
  replace: string;
  uploading: string;
  focalPoint: string;
  focalPointInstructions: string;
  saveFocalPoint: string;
  cancelFocalPoint: string;
  remove: string;
  confirmRemove: string;
  viewPage: string;
  errors: Record<string, string>;
}

export function SiteImageManager({
  groups,
  labels,
}: {
  groups: SiteImageGroupView[];
  labels: SiteImageManagerLabels;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.pageId} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[16px]">{group.pageName}</h2>
            <a
              href={group.pagePath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-ink/50 hover:text-accent"
            >
              {labels.viewPage}
              <ExternalLink size={12} aria-hidden />
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
            {group.slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} labels={labels} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SlotCard({ slot, labels }: { slot: SiteImageSlotView; labels: SiteImageManagerLabels }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFocus, setEditingFocus] = useState(false);
  const [, startTransition] = useTransition();
  const endpoint = `/api/admin/site-images/${slot.id}`;
  const { image } = slot;

  /** Runs one request, then re-renders the page; shows the API's error code as a message if it fails. */
  async function send(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, init);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(labels.errors[body?.error as string] ?? labels.errors.generic);
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } catch {
      setError(labels.errors.generic);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await send({ method: "POST", body: formData });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!window.confirm(labels.confirmRemove)) return;
    await send({ method: "DELETE" });
  }

  async function handleFocalPoint(focalX: number, focalY: number) {
    setEditingFocus(false);
    await send({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focalX, focalY }),
    });
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-admin border border-ink/10 bg-surface p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-admin-sm bg-ink/5">
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="280px"
            className="object-cover"
            style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 border-2 border-dashed border-ink/15 text-ink/40">
            <ImageIcon size={22} aria-hidden />
            <span className="text-[12px]">{labels.empty}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 text-[13px] font-bold leading-snug">{slot.label}</span>
        <span className="text-[11.5px] text-ink/50">
          {slot.shape}
          {image ? ` · ${image.updatedLabel}` : ""}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        <AdminButton
          size="sm"
          variant={image ? "outline" : "dark"}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} aria-hidden />
          {busy ? labels.uploading : image ? labels.replace : labels.upload}
        </AdminButton>
        {image ? (
          <>
            <AdminButton size="sm" disabled={busy} onClick={() => setEditingFocus(true)}>
              <Crosshair size={13} aria-hidden />
              {labels.focalPoint}
            </AdminButton>
            <AdminButton size="sm" variant="outline-danger" disabled={busy} onClick={handleRemove}>
              <Trash2 size={13} aria-hidden />
              {labels.remove}
            </AdminButton>
          </>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      {editingFocus && image ? (
        <FocalPointPicker
          imageUrl={image.url}
          initialX={image.focalX}
          initialY={image.focalY}
          onSave={handleFocalPoint}
          onCancel={() => setEditingFocus(false)}
          instructions={labels.focalPointInstructions}
          saveLabel={labels.saveFocalPoint}
          cancelLabel={labels.cancelFocalPoint}
        />
      ) : null}
    </div>
  );
}
