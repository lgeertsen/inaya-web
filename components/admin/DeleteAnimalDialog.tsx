"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { AdminButton } from "./ui/AdminButton";
import { AdminInput } from "./ui/AdminField";

export function DeleteAnimalDialog({ animalId, animalName }: { animalId: string; animalName: string }) {
  const t = useTranslations("admin.animals.detail");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);

  const canConfirm = confirmText === animalName;

  function close() {
    setOpen(false);
    setConfirmText("");
  }

  async function handleDelete() {
    if (!canConfirm) return;
    setPending(true);
    await fetch(`/api/admin/animals/${animalId}`, { method: "DELETE" });
    router.push("/admin/animals");
    router.refresh();
  }

  return (
    <>
      <AdminButton variant="outline-danger" onClick={() => setOpen(true)}>
        <Trash2 size={14} />
        {t("deleteButton")}
      </AdminButton>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-admin bg-surface p-5">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-bold">{t("deleteTitle", { name: animalName })}</h3>
              <p className="text-[13px] text-ink/70">{t("deleteBody")}</p>
            </div>
            <AdminInput
              autoFocus
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={t("deleteNamePlaceholder")}
              disabled={pending}
            />
            <div className="flex justify-end gap-2">
              <AdminButton variant="outline" size="sm" onClick={close} disabled={pending}>
                {t("deleteCancel")}
              </AdminButton>
              <AdminButton
                variant="outline-danger"
                size="sm"
                onClick={handleDelete}
                disabled={!canConfirm || pending}
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t("deleteConfirmButton")}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
