import { useCallback, useState } from "react";

import type { DigitalCardDto } from "@/lib/api/types";

export type CardImageSlot = "iconImage" | "frontImage" | "backImage";

export interface ICardImages {
  iconImage: string | null;
  frontImage: string | null;
  backImage: string | null;
}

const EMPTY_IMAGES: ICardImages = {
  iconImage: null,
  frontImage: null,
  backImage: null,
};

function imagesOf(card: DigitalCardDto | null): ICardImages {
  if (!card) return EMPTY_IMAGES;

  return {
    iconImage: card.iconImage,
    frontImage: card.frontImage,
    backImage: card.backImage,
  };
}

/**
 * The three base64 images live outside react-hook-form, like the settings avatar does:
 * they would blow the localStorage draft quota and do not belong in dirty tracking. The
 * modal merges them back in on submit and folds isDirty into its own dirty indicator.
 */
export function useCardImages(card: DigitalCardDto | null) {
  const [images, setImages] = useState<ICardImages>(() => imagesOf(card));
  const [isDirty, setIsDirty] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(card?.id ?? null);

  // Adjusted during render rather than in an effect, the way use-lingering-target does it:
  // an edit modal mounts before its card arrives, and a frame showing the previous card's
  // images would be a real flash of the wrong data.
  const cardId = card?.id ?? null;
  if (cardId !== loadedId) {
    setLoadedId(cardId);
    setImages(imagesOf(card));
    setIsDirty(false);
  }

  const setImage = useCallback((slot: CardImageSlot, value: string | null) => {
    setImages((current) => ({ ...current, [slot]: value }));
    setIsDirty(true);
  }, []);

  const resetImages = useCallback(() => {
    setImages(imagesOf(card));
    setIsDirty(false);
  }, [card]);

  return { images, setImage, resetImages, isDirty };
}
