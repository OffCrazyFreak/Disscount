"use client";

import { useTranslations } from "next-intl";

import InboxNotice from "@/components/custom/common/inbox-notice";
import { useSecurity } from "@/components/custom/settings/security/security-context";

export default function PasswordRecovery() {
  const t = useTranslations("settings");
  const { recovery } = useSecurity();

  if (!recovery.sentTo) return null;

  // InboxNotice owns the live region now, so every call site is announced.
  return (
    <InboxNotice
      title={t("security.recovery.title")}
      description={t("security.recovery.description")}
      email={recovery.sentTo}
    />
  );
}
