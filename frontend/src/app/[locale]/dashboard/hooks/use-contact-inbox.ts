"use client";

import { UseMutationResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { contactService } from "@/lib/api";
import { ContactMessageDto } from "@/lib/api/types";

type ContactMutation = UseMutationResult<ContactMessageDto, Error, string>;

// Bundles the admin inbox mutations with their toasts into simple callbacks.
export function useContactInbox() {
  const t = useTranslations("dashboard");
  const markRead = contactService.useMarkRead();
  const markUnread = contactService.useMarkUnread();
  const softDelete = contactService.useSoftDelete();
  const restore = contactService.useRestore();

  function run(mutation: ContactMutation, id: string, message: string) {
    mutation.mutate(id, {
      onSuccess: () => toast.success(message),
      onError: () => toast.error(t("inbox.error")),
    });
  }

  return {
    toggleRead: (m: ContactMessageDto) =>
      m.readAt
        ? run(markUnread, m.id, t("inbox.markedUnread"))
        : run(markRead, m.id, t("inbox.markedRead")),
    remove: (m: ContactMessageDto) => run(softDelete, m.id, t("inbox.deleted")),
    restore: (m: ContactMessageDto) => run(restore, m.id, t("inbox.restored")),
  };
}
