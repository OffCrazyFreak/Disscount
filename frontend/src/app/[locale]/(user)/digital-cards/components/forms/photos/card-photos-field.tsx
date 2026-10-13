"use client";

import { useTranslations } from "next-intl";

import CardPhotoSlotRow from "@/app/[locale]/(user)/digital-cards/components/forms/photos/card-photo-slot";
import type { CardPhotoChanges } from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-form-types";
import { digitalCardService } from "@/lib/api";
import type { CardPhotoSlot } from "@/constants/card-codes";
import type { DigitalCardDto } from "@/lib/api/types";

// Icon first: it is the small round picture on the list tile.
const SLOT_ORDER: CardPhotoSlot[] = ["icon", "front", "back"];

interface ICardPhotosFieldProps {
  cardId: string;
  card: DigitalCardDto | null;
  changes: CardPhotoChanges;
  status: Partial<Record<CardPhotoSlot, "uploading" | "queued" | "error">>;
  onChange: (slot: CardPhotoSlot, change: File | null | undefined) => void;
}

export default function CardPhotosField({
  cardId,
  card,
  changes,
  status,
  onChange,
}: ICardPhotosFieldProps) {
  const t = useTranslations("digitalCards.photos");
  const config = digitalCardService.useDigitalCardsConfig();

  if (config.data?.photosEnabled === false) return null;

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{t("legend")}</legend>

      {SLOT_ORDER.map((slot) => (
        <CardPhotoSlotRow
          key={slot}
          cardId={cardId}
          slot={slot}
          saved={card?.photos.find((photo) => photo.slot === slot)}
          change={changes[slot]}
          status={status[slot]}
          onChange={(change) => onChange(slot, change)}
        />
      ))}

      <p className="text-muted-foreground text-xs">{t("hint")}</p>
    </fieldset>
  );
}
