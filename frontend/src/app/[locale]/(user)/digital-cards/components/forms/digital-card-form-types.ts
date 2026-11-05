import type { CardPhotoSlot } from "@/constants/card-codes";

// A File replaces or adds the slot's photo; null marks the saved photo for removal on save.
export type CardPhotoChanges = Partial<Record<CardPhotoSlot, File | null>>;
