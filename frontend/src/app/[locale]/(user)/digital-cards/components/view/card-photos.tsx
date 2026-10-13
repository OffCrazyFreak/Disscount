import { useTranslations } from "next-intl";

import CardPhotoThumb from "@/app/[locale]/(user)/digital-cards/components/view/card-photo-thumb";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardPhotosProps {
  card: DigitalCardDto;
}

export default function CardPhotos({ card }: ICardPhotosProps) {
  const t = useTranslations("digitalCards");
  const photos = card.photos.filter(
    (photo) => photo.slot === "front" || photo.slot === "back",
  );

  if (photos.length === 0) return null;

  return (
    <section
      aria-label={t("view.photos.label")}
      className="grid grid-cols-2 gap-3"
    >
      {photos.map((photo) => (
        <CardPhotoThumb key={photo.slot} cardId={card.id} photo={photo} />
      ))}
    </section>
  );
}
