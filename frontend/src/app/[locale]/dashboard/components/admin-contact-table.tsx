"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminContactRow from "@/app/[locale]/dashboard/components/admin-contact-row";
import AdminContactDetail from "@/app/[locale]/dashboard/components/admin-contact-detail";
import { useContactInbox } from "@/app/[locale]/dashboard/hooks/use-contact-inbox";
import { useRevealedItems } from "@/hooks/scroll/use-revealed-items";
import { contactService } from "@/lib/api";
import { ContactMessageDto } from "@/lib/api/types";
import { filterByFields } from "@/utils/generic";

type InboxView = "all" | "unread";

const VIEW_LABEL_KEYS = {
  all: "contact.viewAll",
  unread: "contact.viewUnread",
} as const satisfies Record<InboxView, string>;

function matchesView(message: ContactMessageDto, view: InboxView): boolean {
  if (view === "unread") return !message.readAt;
  return true;
}

export default function AdminContactTable() {
  const t = useTranslations("dashboard");
  const [view, setView] = useState<InboxView>("all");
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [detail, setDetail] = useState<ContactMessageDto | null>(null);

  const { data, isLoading, isError } =
    contactService.useGetContactMessages(showDeleted);
  // Only an inbox with nothing cached is missing; a failed refetch keeps its last answer.
  const isMissing = isError && data === undefined;
  const inbox = useContactInbox();

  const messages = useMemo(() => {
    const byView = (data ?? []).filter((m) => matchesView(m, view));
    return filterByFields(byView, search, [
      "fullName",
      "email",
      "subject",
      "message",
    ]);
  }, [data, view, search]);

  const shownMessages = useRevealedItems(
    messages,
    [showDeleted, view, search].join("\0"),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={view} onValueChange={(v) => setView(v as InboxView)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(VIEW_LABEL_KEYS) as InboxView[]).map((key) => (
              <SelectItem key={key} value={key}>
                {t(VIEW_LABEL_KEYS[key])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("contact.searchPlaceholder")}
          className="max-w-xs"
        />

        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
          {t("contact.showDeleted")}
        </label>
      </div>

      {/* The controls stay outside, so a failed view can still be switched away from. */}
      <div className="rounded-lg border">
        {isLoading && (
          <div className="flex justify-center py-12">
            <BlockLoadingSpinner size={24} />
          </div>
        )}

        {isMissing && (
          <p role="alert" className="text-destructive p-6 text-center text-sm">
            {t("contact.loadError")}
          </p>
        )}

        {!isLoading && !isMissing && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("contact.colMessage")}</TableHead>
                  <TableHead>{t("contact.colSender")}</TableHead>
                  <TableHead>{t("contact.colSent")}</TableHead>
                  <TableHead>{t("contact.colStatus")}</TableHead>
                  <TableHead className="text-right">
                    {t("contact.colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shownMessages.map((message) => (
                  <AdminContactRow
                    key={message.id}
                    message={message}
                    onOpen={setDetail}
                    onToggleRead={inbox.toggleRead}
                    onDelete={inbox.remove}
                    onRestore={inbox.restore}
                  />
                ))}
              </TableBody>
            </Table>

            {messages.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                {t("contact.empty")}
              </p>
            )}
          </>
        )}
      </div>

      <AdminContactDetail message={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
