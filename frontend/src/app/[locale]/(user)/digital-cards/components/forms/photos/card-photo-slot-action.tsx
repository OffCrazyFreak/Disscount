"use client";

import { Trash2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { CardPhotoDto } from "@/lib/api/types";

interface ICardPhotoSlotActionProps {
  label: string;
  saved?: CardPhotoDto;
  change: File | null | undefined;
  onClick: () => void;
}

type ActionAriaKey = "restoreAria" | "discardAria" | "removeAria";

function actionAriaKey(
  change: File | null | undefined,
  hasSaved: boolean,
): ActionAriaKey | null {
  if (change === null) return "restoreAria";
  if (change) return "discardAria";
  return hasSaved ? "removeAria" : null;
}

/** Remove, restore or discard, depending on what is staged for the slot. */
export default function CardPhotoSlotAction({
  label,
  saved,
  change,
  onClick,
}: ICardPhotoSlotActionProps) {
  const t = useTranslations("digitalCards.photos");
  const ariaKey = actionAriaKey(change, !!saved);

  if (!ariaKey) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={t(ariaKey, { label })}
      onClick={onClick}
    >
      {change === undefined ? (
        <Trash2 aria-hidden="true" />
      ) : (
        <Undo2 aria-hidden="true" />
      )}
    </Button>
  );
}
