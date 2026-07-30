"use client";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { CodeType } from "@/constants/card-codes";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useWakeLock } from "@/hooks/use-wake-lock";
import CardIcon from "@/app/(user)/digital-cards/components/card-icon";
import CardCodePanel from "@/app/(user)/digital-cards/components/view/card-code-panel";
import CardDetailRows from "@/app/(user)/digital-cards/components/view/card-detail-rows";
import CardFaceImages from "@/app/(user)/digital-cards/components/view/card-face-images";
import CardViewActions from "@/app/(user)/digital-cards/components/view/card-view-actions";
import { useDigitalCard } from "@/app/(user)/digital-cards/hooks/use-digital-card";

interface IDigitalCardViewModalProps {
  open: boolean;
  id: string;
}

export default function DigitalCardViewModal({
  open,
  id,
}: IDigitalCardViewModalProps) {
  const { card, isLoading, isError, notFound } = useDigitalCard(id, {
    enabled: open,
  });

  // This modal exists to be held up at a till, so the screen must not dim mid-transaction.
  useWakeLock(open && !!card);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={card?.cardName ?? "Kartica"}
      description="Pokaži kod na blagajni."
      srOnlyDescription
      size="md"
      headerExtra={
        card ? (
          <div
            className="size-10 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: card.cardColor }}
          >
            <CardIcon
              iconImage={card.iconImage}
              chainCode={card.chainCode}
              storeName={card.storeName}
            />
          </div>
        ) : undefined
      }
      footer={card ? <CardViewActions card={card} /> : undefined}
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Greška pri učitavanju kartice. Pokušaj ponovo.
        </p>
      ) : notFound || !card ? (
        <p className="text-sm text-muted-foreground">
          Kartica nije pronađena. Možda je obrisana.
        </p>
      ) : (
        <div className="space-y-4">
          <CardDetailRows card={card} />

          <CardCodePanel
            codeValue={card.codeValue}
            codeType={card.codeType as CodeType}
          />

          <CardFaceImages
            frontImage={card.frontImage}
            backImage={card.backImage}
          />
        </div>
      )}
    </ModalShell>
  );
}
