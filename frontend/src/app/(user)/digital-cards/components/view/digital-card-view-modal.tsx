"use client";

import { useEffect, useRef } from "react";

import BrightnessHint from "@/app/(user)/digital-cards/components/view/brightness-hint";
import CardCodePanel from "@/app/(user)/digital-cards/components/view/card-code-panel";
import CardDetailRows from "@/app/(user)/digital-cards/components/view/card-detail-rows";
import CardPhotos from "@/app/(user)/digital-cards/components/view/card-photos";
import CardViewActions from "@/app/(user)/digital-cards/components/view/card-view-actions";
import ChainNote from "@/app/(user)/digital-cards/components/view/chain-note";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { useWakeLock } from "@/hooks/use-wake-lock";
import digitalCardService from "@/lib/api/digital-cards";
import { recordCardUsed } from "@/lib/api/digital-cards/last-used";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";

interface IDigitalCardViewModalProps {
  open: boolean;
  id: string;
}

export default function DigitalCardViewModal({
  open,
  id,
}: IDigitalCardViewModalProps) {
  const {
    data: cards,
    isPending,
    isError,
    fetchStatus,
  } = digitalCardService.useGetMyDigitalCards();
  const card = cards?.find((candidate) => candidate.id === id);
  const wakeLock = useWakeLock(open && !!card);
  const recorded = useRef(false);

  useEffect(() => {
    if (!open || !card || recorded.current) return;

    recorded.current = true;
    recordCardUsed(card.id);
  }, [open, card]);

  function handleOpenChange(next: boolean) {
    if (!next) closeModalUrl();
  }

  function renderBody() {
    // Offline with nothing cached, the query sits paused as pending and never resolves.
    if (isPending && fetchStatus !== "paused") {
      return (
        <p className="text-sm text-muted-foreground">Učitavanje kartice...</p>
      );
    }

    if (!cards && (isPending || isError)) {
      return (
        <p role="status" className="text-sm text-muted-foreground">
          Kartice se nisu učitale. Provjeri vezu.
        </p>
      );
    }

    if (!card) {
      return (
        <p role="status" className="text-sm text-muted-foreground">
          Ova kartica više ne postoji ili je nemaš na svom računu.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <CardCodePanel key={card.id} card={card} />
        <BrightnessHint mayDim={!wakeLock.supported || wakeLock.failed} />
        <ChainNote chainCode={card.chainCode} />
        <CardPhotos card={card} />
        <CardDetailRows card={card} />
        <CardViewActions
          card={card}
          onEdit={() =>
            swapModalUrl({ name: "digital-card", action: "edit", id: card.id })
          }
          onDeleted={closeModalUrl}
        />
      </div>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title={card?.cardName ?? "Kartica"}
      description={card?.storeName ?? "Digitalna kartica"}
      srOnlyDescription
      size="md"
    >
      {renderBody()}
    </ModalShell>
  );
}
