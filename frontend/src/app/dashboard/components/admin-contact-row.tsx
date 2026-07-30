"use client";

import { Copy, Mail, MailOpen, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { LOADING_LABELS } from "@/constants/loading-labels";
import { formatDate } from "@/utils/strings";
import { ContactMessageDto } from "@/lib/api/types";

interface IAdminContactRowProps {
  message: ContactMessageDto;
  onOpen: (m: ContactMessageDto) => void;
  onToggleRead: (m: ContactMessageDto) => void;
  onDelete: (m: ContactMessageDto) => void;
  onRestore: (m: ContactMessageDto) => void;
  isTogglingRead: boolean;
  isDeleting: boolean;
  isRestoring: boolean;
}

export default function AdminContactRow({
  message,
  onOpen,
  onToggleRead,
  onDelete,
  onRestore,
  isTogglingRead,
  isDeleting,
  isRestoring,
}: IAdminContactRowProps) {
  const unread = !message.readAt;
  const isDeleted = !!message.deletedAt;
  const email = message.email ?? "";

  // Icon-only, so the spinner is the whole visual and the names carry the copy.
  const readLabel = isTogglingRead
    ? LOADING_LABELS.updating
    : unread
      ? "Označi pročitano"
      : "Označi nepročitano";
  const deleteLabel = isDeleting ? LOADING_LABELS.deleting : "Obriši poruku";
  const restoreLabel = isRestoring ? LOADING_LABELS.restoring : "Vrati poruku";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("E-mail adresa je kopirana!");
    } catch {
      toast.error("Greška pri kopiranju e-maila");
    }
  }

  return (
    <TableRow className={unread ? "font-medium" : undefined}>
      <TableCell className="max-w-xs">
        <button
          type="button"
          onClick={() => onOpen(message)}
          className="text-left hover:underline"
        >
          {unread && (
            <span
              aria-label="Nepročitano"
              className="bg-primary mr-2 inline-block size-2 rounded-full align-middle"
            />
          )}
          {message.subject}
        </button>
        <p className="text-muted-foreground line-clamp-1 text-xs">
          {message.message}
        </p>
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {message.fullName || "-"}
        {email && <div className="text-xs">{email}</div>}
      </TableCell>

      <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
        {formatDate(message.createdAt)}
      </TableCell>

      <TableCell>
        {isDeleted && <Badge variant="destructive">Obrisano</Badge>}
      </TableCell>

      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={readLabel}
            onClick={() => onToggleRead(message)}
            disabled={isTogglingRead}
          >
            {isTogglingRead ? (
              <BlockLoadingSpinner size={24} className="text-inherit" />
            ) : unread ? (
              <MailOpen />
            ) : (
              <Mail />
            )}
          </Button>

          {email && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Kopiraj e-mail"
              onClick={copyEmail}
            >
              <Copy />
            </Button>
          )}

          {isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={restoreLabel}
              onClick={() => onRestore(message)}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <RotateCcw />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={deleteLabel}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(message)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <Trash2 />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
