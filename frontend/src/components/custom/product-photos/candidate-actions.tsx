import { Check, Crop, Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminProductImage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// A label longer than its button wraps inside it, hyphenating a word too long for the tile, instead of spilling over.
const WRAPPING =
  "h-auto min-h-9 py-1.5 whitespace-normal hyphens-auto wrap-anywhere";

export interface ICandidateHandlers {
  onSetMain: () => void;
  onCrop: () => void;
  onToggleHidden: () => void;
  onApprove: () => void;
  onDelete: () => void;
}

interface ICandidateActionsProps extends ICandidateHandlers {
  image: AdminProductImage;
  busy: boolean;
}

export default function CandidateActions({
  image,
  busy,
  onSetMain,
  onCrop,
  onToggleHidden,
  onApprove,
  onDelete,
}: ICandidateActionsProps) {
  const t = useTranslations("productPhotos");
  const hidden = image.status === "HIDDEN";
  // An unconfirmed or reported photo gets a verdict first; the rest can simply be hidden.
  const needsDecision =
    !hidden && (image.status === "PENDING" || image.reportCount > 0);

  return (
    // Crop and its neighbour share a row only when both labels fit on the tile.
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        className={cn("basis-full", WRAPPING)}
        variant={image.main ? "primarySoft" : "primary"}
        icon={Star}
        iconPlacement="left"
        disabled={image.main || hidden || busy}
        onClick={onSetMain}
      >
        {image.main ? t("manager.main") : t("manager.setMain")}
      </Button>
      <Button
        size="sm"
        className={cn("flex-auto", WRAPPING)}
        variant="outline"
        icon={Crop}
        iconPlacement="left"
        disabled={busy}
        onClick={onCrop}
      >
        {t("manager.crop")}
      </Button>
      {needsDecision ? (
        <Button
          size="sm"
          className={cn("flex-auto", WRAPPING)}
          variant="outline"
          icon={Check}
          iconPlacement="left"
          disabled={busy}
          onClick={onApprove}
        >
          {t("manager.approve")}
        </Button>
      ) : (
        <Button
          size="sm"
          className={cn("flex-auto", WRAPPING)}
          variant="outline"
          icon={hidden ? Eye : EyeOff}
          iconPlacement="left"
          disabled={busy || image.main}
          onClick={onToggleHidden}
        >
          {hidden ? t("manager.restore") : t("manager.hide")}
        </Button>
      )}
      <Button
        size="sm"
        className={cn("basis-full", WRAPPING)}
        variant="destructiveSoft"
        icon={Trash2}
        iconPlacement="left"
        disabled={busy}
        onClick={onDelete}
      >
        {t("manager.delete")}
      </Button>
    </div>
  );
}
