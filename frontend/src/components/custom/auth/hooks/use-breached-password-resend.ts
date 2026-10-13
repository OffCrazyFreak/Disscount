import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { localePath } from "@/i18n/locale-path";

const RESEND_COOLDOWN_MS = 60_000;

// The server mails at most one link per window, and that send can fail, so the notice
// always offers the ordinary reset email as well.
export function useBreachedPasswordResend(email: string) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sending, setSending] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!coolingDown) return;

    const timer = window.setTimeout(
      () => setCoolingDown(false),
      RESEND_COOLDOWN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [coolingDown]);

  async function resend() {
    if (sending || coolingDown) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    setSending(true);

    // Cleared first so a second resend changes the status text and is announced again.
    setResent(false);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${appUrl}${localePath(locale, "/reset-password")}`,
      });

      if (error) {
        toast.error(t("forgot.sendError"));
        return;
      }

      setResent(true);
      setCoolingDown(true);
    } catch {
      toast.error(t("forgot.sendError"));
    } finally {
      setSending(false);
    }
  }

  return { resend, sending, coolingDown, resent };
}
