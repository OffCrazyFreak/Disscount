"use client";

import { useState } from "react";

import { peekPendingCard } from "@/app/[locale]/(user)/digital-cards/utils/pending-card-stash";

/** The draft storage key and the card id the form saves under; editId is set only when editing. */
export function useCardDraftIdentity(editId: string | undefined) {
  const draftKey = editId ? `digital-card.edit.${editId}` : "digital-card.new";

  // Client-generated so the create PUT is idempotent and photos have a card to attach to.
  // A retry after a failed create reuses the id the failed attempt used.
  const [newCardId, setNewCardId] = useState(
    () => peekPendingCard(draftKey)?.id ?? crypto.randomUUID(),
  );
  const cardId = editId ?? newCardId;

  function renewCardId() {
    setNewCardId(crypto.randomUUID());
  }

  return { draftKey, cardId, renewCardId };
}
