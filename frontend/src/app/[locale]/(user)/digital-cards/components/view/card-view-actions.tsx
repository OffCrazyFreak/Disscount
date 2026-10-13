"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  archiveAnnouncementKey,
  pinAnnouncementKey,
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
  const t = useTranslations("digitalCards");
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
        {t("view.actions.edit")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        icon={pinned ? PinOff : Pin}
        iconPlacement="left"
        onClick={() => {
          announceCard(t(pinAnnouncementKey(!pinned)));
          pin({ id: card.id, pinned: !pinned });
        }}
      >
        {t(pinned ? "view.actions.unpin" : "view.actions.pin")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        icon={archived ? ArchiveRestore : Archive}
        iconPlacement="left"
        onClick={() => {
          announceCard(t(archiveAnnouncementKey(!archived)));
          archive({ id: card.id, archived: !archived });
        }}
      >
        {t(archived ? "view.actions.unarchive" : "view.actions.archive")}
      </Button>

      <Button
        variant="destructiveSoft"
        size="sm"
        icon={Trash2}
        iconPlacement="left"
        onClick={() => setConfirmingDelete(true)}
      >
        {t("view.actions.delete")}
      </Button>

      <ConfirmDialog
        isOpen={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t("view.actions.deleteTitle")}
        description={t("view.actions.deleteDescription", {
          name: card.cardName,
        })}
        confirmLabel={t("view.actions.delete")}
        cancelLabel={t("view.actions.cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
