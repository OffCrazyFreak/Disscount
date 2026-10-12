"use client";

import { Mail, MailOpen, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/custom/common/copy-button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/utils/strings";
import { ContactMessageDto } from "@/lib/api/types";

interface IAdminContactRowProps {
  message: ContactMessageDto;
  onOpen: (m: ContactMessageDto) => void;
  onToggleRead: (m: ContactMessageDto) => void;
  onDelete: (m: ContactMessageDto) => void;
  onRestore: (m: ContactMessageDto) => void;
}

export default function AdminContactRow({
  message,
  onOpen,
  onToggleRead,
  onDelete,
  onRestore,
}: IAdminContactRowProps) {
  const unread = !message.readAt;
  const isDeleted = !!message.deletedAt;
  const email = message.email ?? "";

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
            aria-label={unread ? "Označi pročitano" : "Označi nepročitano"}
            onClick={() => onToggleRead(message)}
          >
            {unread ? <MailOpen /> : <Mail />}
          </Button>

          {email && (
            <CopyButton
              value={email}
              label="Kopiraj e-mail"
              successMessage="E-mail adresa je kopirana!"
              errorMessage="Greška pri kopiranju e-maila"
            />
          )}

          {isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Vrati poruku"
              onClick={() => onRestore(message)}
            >
              <RotateCcw />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Obriši poruku"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(message)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
