import { Check, Crop, Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminProductImage } from "@/lib/api/types";

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
    <div className="grid grid-cols-2 gap-1.5">
      <Button
        size="sm"
        className="col-span-2"
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
        className="col-span-2"
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
