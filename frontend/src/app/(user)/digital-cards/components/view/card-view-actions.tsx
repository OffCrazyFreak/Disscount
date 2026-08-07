"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import PinToggleButton from "@/app/(user)/digital-cards/components/pin-toggle-button";
import { digitalCardService } from "@/lib/api";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import { problemMessage } from "@/lib/api/problem-details";
import type { DigitalCardDto } from "@/lib/api/types";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { LOADING_LABELS } from "@/constants/loading-labels";

interface ICardViewActionsProps {
  card: DigitalCardDto;
}

export default function CardViewActions({ card }: ICardViewActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = digitalCardService.useDeleteDigitalCard();

  async function handleDelete() {
    setConfirmOpen(false);
    closeModalUrl();

    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan si mreže - promjena će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    try {
      await deleteMutation.mutateAsync(card.id);
      toast.success("Kartica je uspješno obrisana!");
      await queryClient.invalidateQueries({
        queryKey: DIGITAL_CARD_QUERY_KEYS.all,
      });
    } catch (error) {
      toast.error(problemMessage(error, "Greška pri brisanju kartice."));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <PinToggleButton
          card={card}
          className="size-9 bg-muted text-foreground hover:bg-accent"
        />

        <Button
          type="button"
          variant="outline"
          icon={Pencil}
          iconPlacement="left"
          // Pushed, not swapped, so closing the edit modal lands back on this card.
          onClick={() =>
            openModalUrl({
              name: "digital-card",
              action: "edit",
              id: card.id,
            })
          }
        >
          Uredi
        </Button>

        <Button
          type="button"
          variant="destructive"
          icon={Trash2}
          iconPlacement="left"
          onClick={() => setConfirmOpen(true)}
          className="ml-auto"
        >
          Obriši
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Obriši karticu"
        description={`Sigurno želiš obrisati karticu "${card.cardName}"? Ova akcija se ne može poništiti.`}
        confirmLabel={
          deleteMutation.isPending ? LOADING_LABELS.deleting : "Obriši"
        }
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
