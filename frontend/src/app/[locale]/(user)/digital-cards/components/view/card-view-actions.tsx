"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import CardAnnouncer from "@/app/[locale]/(user)/digital-cards/components/card-announcer";
import {
  announceCard,
  archiveAnnouncement,
  pinAnnouncement,
} from "@/app/[locale]/(user)/digital-cards/utils/card-announcer";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { Button } from "@/components/ui/button";
import digitalCardService from "@/lib/api/digital-cards";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardViewActionsProps {
  card: DigitalCardDto;
  onEdit: () => void;
  onDeleted: () => void;
}

export default function CardViewActions({
  card,
  onEdit,
  onDeleted,
}: ICardViewActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { mutate: pin } = digitalCardService.usePinDigitalCard();
  const { mutate: archive } = digitalCardService.useArchiveDigitalCard();
  const { mutate: remove } = digitalCardService.useDeleteDigitalCard();

  const pinned = !!card.pinnedAt;
  const archived = !!card.archivedAt;

  function handleDelete() {
    // Optimistic: the card leaves the list at once and comes back if the server refuses.
    remove(card.id);
    setConfirmingDelete(false);
    onDeleted();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CardAnnouncer />

      <Button
        variant="outline"
        size="sm"
        icon={Pencil}
        iconPlacement="left"
        onClick={onEdit}
      >
        Uredi
      </Button>

      <Button
        variant="outline"
        size="sm"
        icon={pinned ? PinOff : Pin}
        iconPlacement="left"
        onClick={() => {
          announceCard(pinAnnouncement(!pinned));
          pin({ id: card.id, pinned: !pinned });
        }}
      >
        {pinned ? "Otkvači" : "Prikvači"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        icon={archived ? ArchiveRestore : Archive}
        iconPlacement="left"
        onClick={() => {
          announceCard(archiveAnnouncement(!archived));
          archive({ id: card.id, archived: !archived });
        }}
      >
        {archived ? "Vrati iz arhive" : "Arhiviraj"}
      </Button>

      <Button
        variant="destructiveSoft"
        size="sm"
        icon={Trash2}
        iconPlacement="left"
        onClick={() => setConfirmingDelete(true)}
      >
        Obriši
      </Button>

      <ConfirmDialog
        isOpen={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Obriši karticu"
        description={`Sigurno želiš obrisati karticu "${card.cardName}"? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
