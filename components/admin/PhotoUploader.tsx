"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type { AnimalPhoto } from "@/lib/animals";

export function PhotoUploader({
  animalId,
  photos,
  removeLabel,
  uploadLabel,
}: {
  animalId: string;
  photos: AnimalPhoto[];
  removeLabel: string;
  uploadLabel: string;
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

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(photo.id)}
                className="absolute inset-0 bg-black/55 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {removeLabel}
              </button>
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
