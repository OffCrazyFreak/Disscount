"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { localePath } from "@/i18n/locale-path";
import { useUser } from "@/context/user-context";

// Sends the standard reset email to the signed-in user, so a forgotten current
// password is not a dead end inside settings.
export function usePasswordRecovery() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const { user } = useUser();
  const currentEmail = user?.email ?? "";

  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send() {
    if (!currentEmail || sending) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    setSending(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: currentEmail,
        redirectTo: `${appUrl}${localePath(locale, "/reset-password")}`,
      });

      // The login modal leaves { error } uninspected so it can't confirm an
      // account; here the caller is authenticated and owns the address, so
      // there is nothing to leak and a real failure is worth reporting.
      if (error) {
        toast.error(t("security.recovery.sendFailed"));
        return;
      }

      setSentTo(currentEmail);
    } catch {
      toast.error(t("security.recovery.sendFailed"));
    } finally {
      setSending(false);
    }
  }

  return { send, sending, sentTo };
}
