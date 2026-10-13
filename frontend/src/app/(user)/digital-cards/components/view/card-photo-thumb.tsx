"use client";

import { useState } from "react";

import { useCardPhoto } from "@/app/(user)/digital-cards/hooks/use-card-photo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD_PHOTO_SLOT_LABELS } from "@/constants/card-codes";
import type { CardPhotoDto } from "@/lib/api/types";

interface ICardPhotoThumbProps {
  cardId: string;
  photo: CardPhotoDto;
}

export default function CardPhotoThumb({
  cardId,
  photo,
}: ICardPhotoThumbProps) {
  const [enlarged, setEnlarged] = useState(false);
  const url = useCardPhoto(cardId, photo, "full");
  const label = CARD_PHOTO_SLOT_LABELS[photo.slot];

  if (!url) return <Skeleton className="aspect-[3/2] w-full rounded-lg" />;

  return (
    <>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        aria-label={`Povećaj sliku: ${label}`}
        className="overflow-hidden rounded-lg border focus-visible:outline-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob object URL, nothing for next/image to optimise */}
        <img
          src={url}
          alt={label}
          className="aspect-[3/2] w-full object-cover"
        />
      </button>

      <Dialog open={enlarged} onOpenChange={setEnlarged}>
        <DialogContent aria-describedby={undefined} className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob object URL */}
          <img
            src={url}
            alt={label}
            className="max-h-[80dvh] w-full rounded-md object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
