"use client";

import { useLocale, useTranslations } from "next-intl";
import { Mail, MailOpen, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/custom/common/copy-button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/utils/strings";
import { ContactMessageDto } from "@/lib/api/types";

const EMPTY_VALUE = "-";

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
  const t = useTranslations("dashboard");
  const locale = useLocale();
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
              aria-label={t("contactRow.unreadMarker")}
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
        {message.fullName || EMPTY_VALUE}
        {email && <div className="text-xs">{email}</div>}
      </TableCell>

      <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
        {formatDate(message.createdAt, locale)}
      </TableCell>

      <TableCell>
        {isDeleted && (
          <Badge variant="destructive">{t("contactRow.deletedBadge")}</Badge>
        )}
      </TableCell>

      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              unread ? t("contactRow.markRead") : t("contactRow.markUnread")
            }
            onClick={() => onToggleRead(message)}
          >
            {unread ? <MailOpen /> : <Mail />}
          </Button>

          {email && (
            <CopyButton
              value={email}
              label={t("contactRow.copyEmail")}
              successMessage={t("contactRow.copySuccess")}
              errorMessage={t("contactRow.copyError")}
            />
          )}

          {isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("contactRow.restore")}
              onClick={() => onRestore(message)}
            >
              <RotateCcw />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("contactRow.delete")}
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
