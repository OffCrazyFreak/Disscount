"use client";

import CardImageSlot from "@/app/(user)/digital-cards/components/forms/card-image-slot";
import type {
  CardImageSlot as SlotName,
  ICardImages,
} from "@/app/(user)/digital-cards/hooks/use-card-images";

interface ICardImagesFieldProps {
  images: ICardImages;
  onImageChange: (slot: SlotName, value: string | null) => void;
  /** Fires for the icon and front slots, which can suggest the card's colour. */
  onColorSource: (file: File) => void;
}

// The icon is a small medallion, so 256px is plenty. The card faces are the backup a
// cashier reads off the screen, so they get four times the detail.
const ICON_MAX_SIZE = 256;
const FACE_MAX_SIZE = 1024;
const ICON_MAX_LENGTH = 400_000;
const FACE_MAX_LENGTH = 1_200_000;

export default function CardImagesField({
  images,
  onImageChange,
  onColorSource,
}: ICardImagesFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Slike kartice</p>

      <div className="grid grid-cols-3 gap-3">
        <CardImageSlot
          label="Ikona"
          value={images.iconImage}
          maxSize={ICON_MAX_SIZE}
          maxLength={ICON_MAX_LENGTH}
          onChange={(value) => onImageChange("iconImage", value)}
          onPicked={onColorSource}
        />
        <CardImageSlot
          label="Prednja strana"
          value={images.frontImage}
          maxSize={FACE_MAX_SIZE}
          maxLength={FACE_MAX_LENGTH}
          onChange={(value) => onImageChange("frontImage", value)}
          onPicked={onColorSource}
        />
        <CardImageSlot
          label="Stražnja strana"
          value={images.backImage}
          maxSize={FACE_MAX_SIZE}
          maxLength={FACE_MAX_LENGTH}
          onChange={(value) => onImageChange("backImage", value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Slike prednje i stražnje strane su rezerva ako kod ne proradi na
        blagajni.
      </p>
    </div>
  );
}
