"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  Mail,
  MailOpen,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/utils/strings";
import { ContactMessageDto } from "@/lib/api/types";

interface IAdminContactRowProps {
  message: ContactMessageDto;
  onOpen: (m: ContactMessageDto) => void;
  onToggleRead: (m: ContactMessageDto) => void;
  onToggleArchive: (m: ContactMessageDto) => void;
  onDelete: (m: ContactMessageDto) => void;
  onRestore: (m: ContactMessageDto) => void;
}

export default function AdminContactRow({
  message,
  onOpen,
  onToggleRead,
  onToggleArchive,
  onDelete,
  onRestore,
}: IAdminContactRowProps) {
  const unread = !message.readAt;
  const isDeleted = !!message.deletedAt;
  const email = message.email ?? "";

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
        <div className="flex flex-wrap gap-1">
          {message.archivedAt && <Badge variant="secondary">Arhivirano</Badge>}
          {isDeleted && <Badge variant="destructive">Obrisano</Badge>}
        </div>
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
            {unread ? (
              <MailOpen className="size-4" />
            ) : (
              <Mail className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={message.archivedAt ? "Vrati iz arhive" : "Arhiviraj"}
            onClick={() => onToggleArchive(message)}
          >
            {message.archivedAt ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
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
              <Copy className="size-4" />
            </Button>
          )}

          {isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Vrati poruku"
              onClick={() => onRestore(message)}
            >
              <RotateCcw className="size-4" />
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
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
