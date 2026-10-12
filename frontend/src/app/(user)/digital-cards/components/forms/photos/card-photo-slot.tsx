"use client";

import { useRef } from "react";
import { Trash2, Undo2 } from "lucide-react";

import CardPhotoPreview from "@/app/(user)/digital-cards/components/forms/photos/card-photo-preview";
import { Button } from "@/components/ui/button";
import {
  CARD_PHOTO_SLOT_LABELS,
  type CardPhotoSlot,
} from "@/constants/card-codes";
import type { CardPhotoDto } from "@/lib/api/types";

const STATUS_TEXT = {
  uploading: "Slanje u tijeku",
  queued: "Čeka slanje",
  error: "Slanje nije uspjelo",
} as const;

interface ICardPhotoSlotProps {
  cardId: string;
  slot: CardPhotoSlot;
  saved?: CardPhotoDto;
  change: File | null | undefined;
  status?: keyof typeof STATUS_TEXT;
  onChange: (change: File | null | undefined) => void;
}

function describe(
  change: File | null | undefined,
  status: ICardPhotoSlotProps["status"],
  hasSaved: boolean,
): string {
  if (change === null) return "Slika će biti uklonjena pri spremanju";
  if (change) return "Nova slika se sprema s karticom";
  if (status) return STATUS_TEXT[status];
  return hasSaved ? "Spremljeno" : "Nema slike";
}

export default function CardPhotoSlotRow({
  cardId,
  slot,
  saved,
  change,
  status,
  onChange,
}: ICardPhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = CARD_PHOTO_SLOT_LABELS[slot];
  const hasImage = change ? true : change === undefined && !!saved;

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
          {describe(change, status, !!saved)}
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
        type="button"
        variant="outline"
        size="sm"
        aria-label={`${hasImage ? "Zamijeni" : "Dodaj"} sliku: ${label}`}
        onClick={() => inputRef.current?.click()}
      >
        {hasImage ? "Zamijeni" : "Dodaj"}
      </Button>

      {change !== undefined && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            change === null
              ? `Vrati sliku: ${label}`
              : `Odbaci novu sliku: ${label}`
          }
          onClick={() => onChange(undefined)}
        >
          <Undo2 aria-hidden="true" />
        </Button>
      )}

      {change === undefined && saved && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Ukloni sliku: ${label}`}
          onClick={() => onChange(null)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
