"use client";

import { useEffect, useEffectEvent } from "react";
import { useLocale } from "next-intl";

import { readLocaleCookie, writeLocaleCookie } from "@/i18n/locale-cookie";
import { isLocale } from "@/i18n/locales";
import { useSession } from "@/lib/auth/client";
import { queueAccountLocaleSave } from "@/components/custom/locale/account-locale-save";

/**
 * Keeps the account and this device agreeing on the language, the way Gitea and
 * Rallly do: an account with no language yet takes the one it signed in on, and
 * on sign-in the account's choice overwrites the device's.
 */
// Module scope survives the remount a language switch causes, so the switch's own
// cookie write is not undone by a session that has not refetched yet.
let syncedUserId: string | null = null;

export default function LocaleSync() {
  const locale = useLocale();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const accountLocale = session?.user?.locale;

  // Runs once per sign-in, not on every page: the current page language is only
  // the seed for an account that has none.
  const syncAccount = useEffectEvent((signedInId: string) => {
    if (!isLocale(accountLocale)) {
      // A failed seed needs no toast: the account stays empty and seeds again next sign-in.
      queueAccountLocaleSave(
        signedInId,
        readLocaleCookie() ?? locale,
        () => {},
      );
      return;
    }

    if (readLocaleCookie() !== accountLocale) writeLocaleCookie(accountLocale);
  });

  useEffect(() => {
    if (!userId) {
      syncedUserId = null;
      return;
    }
    if (userId === syncedUserId) return;
    syncedUserId = userId;

    syncAccount(userId);
  }, [userId]);

  return null;
}
