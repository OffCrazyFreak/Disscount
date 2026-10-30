"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import CardPhotoPreview from "@/app/[locale]/(user)/digital-cards/components/forms/photos/card-photo-preview";
import CardPhotoSlotAction from "@/app/[locale]/(user)/digital-cards/components/forms/photos/card-photo-slot-action";
import { Button } from "@/components/ui/button";
import {
  CARD_PHOTO_SLOT_LABEL_KEYS,
  type CardPhotoSlot,
} from "@/constants/card-codes";
import type { CardPhotoDto } from "@/lib/api/types";

interface ICardPhotoSlotProps {
  cardId: string;
  slot: CardPhotoSlot;
  saved?: CardPhotoDto;
  change: File | null | undefined;
  status?: "uploading" | "queued" | "error";
  onChange: (change: File | null | undefined) => void;
}

function describe(
  change: File | null | undefined,
  status: ICardPhotoSlotProps["status"],
  hasSaved: boolean,
): `status.${
  | "removed"
  | "added"
  | NonNullable<ICardPhotoSlotProps["status"]>
  | "saved"
  | "empty"}` {
  if (change === null) return "status.removed";
  if (change) return "status.added";
  if (status) return `status.${status}`;
  return hasSaved ? "status.saved" : "status.empty";
}

export default function CardPhotoSlotRow({
  cardId,
  slot,
  saved,
  change,
  status,
  onChange,
}: ICardPhotoSlotProps) {
  const t = useTranslations("digitalCards.photos");
  const tRoot = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLButtonElement>(null);
  const label = tRoot(CARD_PHOTO_SLOT_LABEL_KEYS[slot]);
  const hasImage = change ? true : change === undefined && !!saved;

  // One button for remove, restore and discard keeps the focused element mounted as the
  // label changes; discarding a not-yet-saved photo hides it, so focus moves to the add button.
  function handleAction() {
    if (change === undefined) {
      onChange(null);
      return;
    }

    onChange(undefined);
    if (!saved) pickRef.current?.focus();
  }

  function handlePick(file: File | undefined, input: HTMLInputElement) {
    // Cleared so picking the same file again still fires a change.
    input.value = "";
    if (file) onChange(file);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <CardPhotoPreview
        cardId={cardId}
        slot={slot}
        label={label}
        saved={saved}
        change={change}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p role="status" className="text-muted-foreground text-xs">
          {t(describe(change, status, !!saved))}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // The icon is a logo or sticker, not something to photograph in place.
        capture={slot === "icon" ? undefined : "environment"}
        hidden
        onChange={(event) => handlePick(event.target.files?.[0], event.target)}
      />

      <Button
        ref={pickRef}
        type="button"
        variant="outline"
        size="sm"
        aria-label={t(hasImage ? "replaceAria" : "addAria", { label })}
        onClick={() => inputRef.current?.click()}
      >
        {hasImage ? t("replace") : t("add")}
      </Button>

      <CardPhotoSlotAction
        label={label}
        saved={saved}
        change={change}
        onClick={handleAction}
      />
    </div>
  );
}
