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

  return {
    toggleRead: (m: ContactMessageDto) =>
      m.readAt
        ? run(markUnread, m.id, "Označeno kao nepročitano.")
        : run(markRead, m.id, "Označeno kao pročitano."),
    remove: (m: ContactMessageDto) =>
      run(softDelete, m.id, "Poruka je obrisana."),
    restore: (m: ContactMessageDto) => run(restore, m.id, "Poruka je vraćena."),
  };
}
