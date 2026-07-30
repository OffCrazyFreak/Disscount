"use client";

import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import { contactService } from "@/lib/api";
import { ContactMessageDto } from "@/lib/api/types";

type ContactMutation = UseMutationResult<ContactMessageDto, Error, string>;

// Bundles the admin inbox mutations with their toasts into simple callbacks.
export function useContactInbox() {
  const markRead = contactService.useMarkRead();
  const markUnread = contactService.useMarkUnread();
  const softDelete = contactService.useSoftDelete();
  const restore = contactService.useRestore();

  function run(mutation: ContactMutation, id: string, message: string) {
    mutation.mutate(id, {
      onSuccess: () => toast.success(message),
      onError: () => toast.error("Nešto je pošlo po zlu."),
    });
  }

  // Which row is busy, and doing what, so a table of rows can show it per row.
  // `variables` is the id, since each of these mutations takes only that.
  function pendingIdFor(...mutations: ContactMutation[]) {
    return mutations.find((m) => m.isPending)?.variables ?? null;
  }

  return {
    readPendingId: pendingIdFor(markRead, markUnread),
    deletePendingId: pendingIdFor(softDelete),
    restorePendingId: pendingIdFor(restore),
    toggleRead: (m: ContactMessageDto) =>
      m.readAt
        ? run(markUnread, m.id, "Označeno kao nepročitano.")
        : run(markRead, m.id, "Označeno kao pročitano."),
    remove: (m: ContactMessageDto) =>
      run(softDelete, m.id, "Poruka je obrisana."),
    restore: (m: ContactMessageDto) => run(restore, m.id, "Poruka je vraćena."),
  };
}
