"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type { AnimalPhoto } from "@/lib/animals";

export function PhotoUploader({
  animalId,
  photos,
  removeLabel,
  uploadLabel,
  setCoverLabel,
  coverBadgeLabel,
  canManage,
}: {
  animalId: string;
  photos: AnimalPhoto[];
  removeLabel: string;
  uploadLabel: string;
  setCoverLabel: string;
  coverBadgeLabel: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              {photo.isFeatured ? (
                <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-pill bg-accent text-white">
                  {coverBadgeLabel}
                </span>
              ) : null}
              {canManage ? (
                <div className="absolute inset-0 bg-black/55 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                  {!photo.isFeatured ? (
                    <button type="button" onClick={() => handleSetCover(photo.id)}>
                      {setCoverLabel}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => handleRemove(photo.id)}>
                    {removeLabel}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <label className="text-sm font-bold text-accent cursor-pointer w-fit">
        {uploading ? "…" : uploadLabel}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>
    </div>
  );
}
