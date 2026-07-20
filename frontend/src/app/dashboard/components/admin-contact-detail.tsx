"use client";

import { Mail } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
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
                Odgovori
              </a>
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            Zatvori
          </Button>
        </div>
      }
    >
      {message && (
        <div className="space-y-4 text-sm">
          <div className="text-muted-foreground space-y-1">
            <p>
              Od: {message.fullName || "Nepoznato"}
              {email && ` (${email})`}
            </p>
            <p>Poslano: {formatDate(message.createdAt)}</p>
            {message.sourcePath && <p>Stranica: {message.sourcePath}</p>}
          </div>

          <p className="whitespace-pre-wrap">{message.message}</p>
        </div>
      )}
    </ModalShell>
  );
}
