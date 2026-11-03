"use client";

import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AccountSessionDto } from "@/lib/api/schemas/account-session";
import {
  DEVICE_ICONS,
  countryName,
  lastActiveWhen,
} from "@/components/custom/settings/security/sessions/session-labels";

interface IActiveSessionRowProps {
  session: AccountSessionDto;
  isRevoking: boolean;
  onRevoke: (id: string) => void;
}

export default function ActiveSessionRow({
  session,
  isRevoking,
  onRevoke,
}: IActiveSessionRowProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const Icon = DEVICE_ICONS[session.deviceType ?? "unknown"];

  const device =
    session.browser && session.os
      ? t("security.sessions.device", {
          browser: session.browser,
          os: session.os,
        })
      : (session.browser ?? session.os ?? t("security.sessions.unknownDevice"));
  const details = [
    countryName(session.country, locale),
    t("security.sessions.lastActive", {
      when: lastActiveWhen(session.lastActiveAt, locale),
    }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3 py-2">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {device}
          {session.isCurrent && (
            <Badge variant="primarySoft">
              {t("security.sessions.thisDevice")}
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{details}</p>
      </div>

      {!session.isCurrent && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={LogOut}
          iconPlacement="left"
          loading={isRevoking}
          loadingIconPlacement="left"
          aria-label={t("security.sessions.signOutDevice", { device })}
          onClick={() => onRevoke(session.id)}
        >
          {t("security.sessions.signOut")}
        </Button>
      )}
    </li>
  );
}
