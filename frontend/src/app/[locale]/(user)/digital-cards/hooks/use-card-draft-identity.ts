"use client";

import { useState } from "react";

import { peekPendingCard } from "@/app/[locale]/(user)/digital-cards/utils/pending-card-stash";

export function useCardDraftIdentity(editId: string | undefined) {
  const draftKey = editId ? `digital-card.edit.${editId}` : "digital-card.new";

  // Client-generated so the create PUT is idempotent and photos have a card to attach to; a retry reuses the same id.
  const [newCardId, setNewCardId] = useState(
    () => peekPendingCard(draftKey)?.id ?? crypto.randomUUID(),
  );
  const cardId = editId ?? newCardId;

  function renewCardId() {
    setNewCardId(crypto.randomUUID());
  }

  return { draftKey, cardId, renewCardId };
}
