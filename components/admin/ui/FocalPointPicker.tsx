"use client";

import { useRef, useState } from "react";
import { AdminButton } from "./AdminButton";

/** Modal overlay for picking the point on a photo that should stay visible when it's cropped into a fixed-aspect-ratio container. */
export function FocalPointPicker({
  imageUrl,
  initialX,
  initialY,
  onSave,
  onCancel,
  instructions,
  saveLabel,
  cancelLabel,
}: {
  imageUrl: string;
  initialX: number;
  initialY: number;
  onSave: (x: number, y: number) => void;
  onCancel: () => void;
  instructions: string;
  saveLabel: string;
  cancelLabel: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState({ x: initialX, y: initialY });

  function updateFromEvent(e: React.PointerEvent) {
    const rect = frameRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPoint({ x, y });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-admin bg-surface p-5">
        <p className="text-[13px] text-ink/70">{instructions}</p>
        <div
          ref={frameRef}
          className="relative aspect-square w-full cursor-crosshair select-none overflow-hidden rounded-admin-sm"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromEvent(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) updateFromEvent(e);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          <div
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-card"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <AdminButton variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </AdminButton>
          <AdminButton variant="dark" size="sm" onClick={() => onSave(point.x, point.y)}>
            {saveLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
