import Image from "next/image";
import { getDisplayPhoto, getPlaceholderPhotoUrl, type Animal } from "@/lib/animals";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

/** Animal thumbnail for list rows/cards: real photo when available, else the diagonal-stripe placeholder. */
export function AnimalThumb({
  animal,
  size = 30,
  rounded = 8,
}: {
  animal: Pick<Animal, "species" | "photos">;
  size?: number;
  rounded?: number;
}) {
  const photo = getDisplayPhoto(animal);
  const url = photo?.url ?? getPlaceholderPhotoUrl(animal.species);
  if (!url) return <PhotoPlaceholder size={size} rounded={rounded} />;
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      className="flex-none border border-ink/8 object-cover"
      style={{
        borderRadius: rounded,
        objectPosition: photo ? `${photo.focalX * 100}% ${photo.focalY * 100}%` : undefined,
      }}
    />
  );
}
