import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getAnimals } from "@/lib/animals";
import { listInShelterStatuses } from "@/lib/animal-care";
import { DeleteAnimalButton } from "@/components/admin/DeleteAnimalButton";

export default async function AdminAnimalsPage() {
  const t = await getTranslations("admin.animals");
  const supabase = await createClient();
  const [animals, inShelterStatuses] = await Promise.all([
    getAnimals(supabase, { publishedOnly: false }),
    listInShelterStatuses(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">{t("title")}</h1>
        <ButtonLink href="/admin/animals/new">{t("add")}</ButtonLink>
      </div>

      {animals.length === 0 ? (
        <p className="opacity-60 text-sm">{t("empty")}</p>
      ) : (
        <div className="bg-surface rounded-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {animals.map((animal) => (
                <tr key={animal.id} className="border-b border-ink/10 last:border-0">
                  <td className="p-4 font-bold whitespace-nowrap">{animal.name}</td>
                  <td className="p-4 opacity-60 whitespace-nowrap">{animal.species}</td>
                  <td className="p-4 opacity-60 whitespace-nowrap">
                    {animal.track} / {animal.status}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-pill ${
                        animal.isPublished ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {animal.isPublished ? t("publishedYes") : t("publishedNo")}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-pill ${
                        inShelterStatuses[animal.id]
                          ? "bg-accent/10 text-accent"
                          : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {inShelterStatuses[animal.id]
                        ? t("internalDetails.inShelterYes")
                        : t("internalDetails.inShelterNo")}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex gap-4 justify-end">
                      <Link
                        href={`/admin/animals/${animal.id}/edit`}
                        className="font-bold text-accent"
                      >
                        {t("edit")}
                      </Link>
                      <DeleteAnimalButton
                        animalId={animal.id}
                        label={t("delete")}
                        confirmMessage={t("deleteConfirm")}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
