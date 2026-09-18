"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Star, Crosshair, Trash2, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { AnimalPhoto } from "@/lib/animals";
import { FocalPointPicker } from "./ui/FocalPointPicker";

export function PhotoUploader({
  animalId,
  photos,
  removeLabel,
  uploadLabel,
  setCoverLabel,
  coverBadgeLabel,
  setFocalPointLabel,
  focalPointInstructions,
  saveFocalPointLabel,
  cancelFocalPointLabel,
  uploadedByLabel,
  canManage,
}: {
  animalId: string;
  photos: AnimalPhoto[];
  removeLabel: string;
  uploadLabel: string;
  setCoverLabel: string;
  coverBadgeLabel: string;
  setFocalPointLabel: string;
  focalPointInstructions: string;
  saveFocalPointLabel: string;
  cancelFocalPointLabel: string;
  /** Prefix shown before the uploader's name, e.g. "Added by" — omit to hide the caption entirely (photo.uploadedByName is only resolved on the admin Photos tab). */
  uploadedByLabel?: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AnimalPhoto | null>(null);
  const [, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    await fetch(`/api/admin/animals/${animalId}/photos`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => router.refresh());
  }

  async function handleRemove(photoId: string) {
    await fetch(`/api/admin/animals/${animalId}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    startTransition(() => router.refresh());
  }

  async function handleSetCover(photoId: string) {
    await fetch(`/api/admin/animals/${animalId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    startTransition(() => router.refresh());
  }

  async function handleSetFocalPoint(photoId: string, focalX: number, focalY: number) {
    await fetch(`/api/admin/animals/${animalId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, focalX, focalY }),
    });
    setEditingPhoto(null);
    startTransition(() => router.refresh());
  }

  const orderedPhotos = [...photos].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      disabled={uploading}
      onChange={(e) => handleFiles(e.target.files)}
      className="hidden"
    />
  );

  const gridUploadTile = (
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-admin-sm border-2 border-dashed border-ink/20 text-ink/60 transition-colors hover:border-accent hover:text-accent">
      <Upload className="size-5" aria-hidden="true" />
      <span className="text-[11.5px] font-bold text-center px-1">{uploading ? "…" : uploadLabel}</span>
      {fileInput}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {orderedPhotos.map((photo) => (
          <div key={photo.id} className="flex flex-col gap-1">
            <div className="relative aspect-square overflow-hidden rounded-admin-sm group">
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: `${photo.focalX * 100}% ${photo.focalY * 100}%` }}
              />
              {photo.isFeatured ? (
                <span
                  className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-pill bg-accent text-white"
                  title={coverBadgeLabel}
                >
                  <Star className="size-2.5 fill-current" aria-hidden="true" />
                  {coverBadgeLabel}
                </span>
              ) : null}
              {canManage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.isFeatured ? (
                    <button
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      title={setCoverLabel}
                      className="flex items-center gap-1.5 rounded-[8px] bg-white/90 px-2.5 py-1.5 text-[11.5px] font-bold text-ink hover:bg-white"
                    >
                      <Star className="size-3" aria-hidden="true" />
                      {setCoverLabel}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditingPhoto(photo)}
                    title={setFocalPointLabel}
                    className="flex items-center gap-1.5 rounded-[8px] bg-white/90 px-2.5 py-1.5 text-[11.5px] font-bold text-ink hover:bg-white"
                  >
                    <Crosshair className="size-3" aria-hidden="true" />
                    {setFocalPointLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(photo.id)}
                    title={removeLabel}
                    className="flex items-center gap-1.5 rounded-[8px] bg-white/90 px-2.5 py-1.5 text-[11.5px] font-bold text-danger hover:bg-white"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                    {removeLabel}
                  </button>
                </div>
              ) : null}
            </div>
            {uploadedByLabel && photo.uploadedByName ? (
              <span className="truncate text-[10.5px] text-ink/50" title={photo.uploadedByName}>
                {uploadedByLabel} {photo.uploadedByName}
              </span>
            ) : null}
          </div>
        ))}
        {gridUploadTile}
      </div>
      {editingPhoto ? (
        <FocalPointPicker
          imageUrl={editingPhoto.url}
          initialX={editingPhoto.focalX}
          initialY={editingPhoto.focalY}
          onSave={(x, y) => handleSetFocalPoint(editingPhoto.id, x, y)}
          onCancel={() => setEditingPhoto(null)}
          instructions={focalPointInstructions}
          saveLabel={saveFocalPointLabel}
          cancelLabel={cancelFocalPointLabel}
        />
      ) : null}
    </div>
  );
}
