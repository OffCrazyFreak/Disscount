"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { readLocaleCookie, writeLocaleCookie } from "@/i18n/locale-cookie";
import { isLocale } from "@/i18n/locales";
import { authClient, useSession } from "@/lib/auth/client";

/**
 * Keeps the account and this device agreeing on the language, the way Gitea and
 * Rallly do: an account with no language yet takes the one it signed in on, and
 * on sign-in the account's choice overwrites the device's.
 */
export default function LocaleSync() {
  const locale = useLocale();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const accountLocale = session?.user?.locale;

  useEffect(() => {
    if (!userId) return;

    if (!isLocale(accountLocale)) {
      void authClient.updateUser({ locale: readLocaleCookie() ?? locale });
      return;
    }

    if (readLocaleCookie() !== accountLocale) writeLocaleCookie(accountLocale);
    // Runs on sign-in, not on every page: the current page language is only the
    // seed for an account that has none.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, accountLocale]);

  return null;
}
