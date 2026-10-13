"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CardPhotoSlot } from "@/constants/card-codes";
import { useCardPhoto } from "@/app/[locale]/(user)/digital-cards/hooks/use-card-photo";
import { useObjectUrl } from "@/app/[locale]/(user)/digital-cards/hooks/use-object-url";
import type { CardPhotoDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ICardPhotoPreviewProps {
  cardId: string;
  slot: CardPhotoSlot;
  label: string;
  saved?: CardPhotoDto;
  // A picked file wins over the saved photo; null means the saved one is being removed.
  change: File | null | undefined;
}

export default function CardPhotoPreview({
  cardId,
  slot,
  label,
  saved,
  change,
}: ICardPhotoPreviewProps) {
  const t = useTranslations("digitalCards.photos");
  const pickedUrl = useObjectUrl(change);
  const savedUrl = useCardPhoto(
    cardId,
    saved,
    slot === "icon" ? "full" : "thumb",
  );
  const url = change === null ? undefined : (pickedUrl ?? savedUrl);

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground relative flex shrink-0 items-center justify-center overflow-hidden",
        slot === "icon" ? "size-16 rounded-full" : "h-16 w-24 rounded-md",
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={t("preview", { label })}
          fill
          unoptimized
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <ImageIcon className="size-6" aria-hidden="true" />
      )}
    </div>
  );
}
