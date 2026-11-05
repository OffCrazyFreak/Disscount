"use client";

import { useEffect, useEffectEvent } from "react";
import { useLocale } from "next-intl";

import { readLocaleCookie, writeLocaleCookie } from "@/i18n/locale-cookie";
import { isLocale } from "@/i18n/locales";
import { useSession } from "@/lib/auth/client";
import { queueAccountLocaleSave } from "@/components/custom/locale/account-locale-save";

/** A language-less account takes its sign-in language; afterwards the account overwrites the device. */
// Module scope survives a switch's remount, so a stale session cannot undo its cookie write.
let syncedUserId: string | null = null;

export default function LocaleSync() {
  const locale = useLocale();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const accountLocale = session?.user?.locale;

  // Once per sign-in, because the page language is only the seed for an account that has none.
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
