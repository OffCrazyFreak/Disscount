"use client";

import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/strings";
import { ContactMessageDto } from "@/lib/api/types";

interface IAdminContactDetailProps {
  message: ContactMessageDto | null;
  onClose: () => void;
}

export default function AdminContactDetail({
  message,
  onClose,
}: IAdminContactDetailProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const email = message?.email ?? "";

  return (
    <ModalShell
      open={!!message}
      onOpenChange={(open) => !open && onClose()}
      title={message?.subject ?? ""}
      size="lg"
      footer={
        <div className="flex justify-end gap-2 p-4">
          {email && (
            <Button asChild variant="outline">
              <a href={`mailto:${email}`}>
                <Mail className="size-4" />
                {t("contactDetail.reply")}
              </a>
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            {t("contactDetail.close")}
          </Button>
        </div>
      }
    >
      {message && (
        <div className="space-y-4 text-sm">
          <div className="text-muted-foreground space-y-1">
            <p>
              {t("contactDetail.from", {
                name: message.fullName || t("contactDetail.unknownSender"),
              })}
              {email && ` (${email})`}
            </p>
            <p>
              {t("contactDetail.sent", {
                date: formatDate(message.createdAt, locale),
              })}
            </p>
            {message.sourcePath && (
              <p>{t("contactDetail.page", { path: message.sourcePath })}</p>
            )}
          </div>

          <p className="whitespace-pre-wrap">{message.message}</p>
        </div>
      )}
    </ModalShell>
  );
}
