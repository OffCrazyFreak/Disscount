"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";
import { writeLocaleCookie } from "@/i18n/locale-cookie";
import type { AppLocale } from "@/i18n/locales";
import { authClient, useSession } from "@/lib/auth/client";

// Chained at module scope so saves land in click order and survive the remount a
// switch causes.
let accountSave: Promise<void> = Promise.resolve();

// An explicit pick: remembered on this device and, when signed in, on the account.
export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("locale");

  function changeLocale(next: AppLocale) {
    writeLocaleCookie(next);

    if (session?.user) {
      // Always saved, never compared with the session, which lags behind a quick
      // second switch. The next sign-in copies the account value back over the
      // cookie, so a failed save would quietly undo the switch later.
      accountSave = accountSave
        .then(() => authClient.updateUser({ locale: next }))
        .then(({ error }) => {
          if (error) toast.error(t("saveFailed"));
        })
        // A rejected link would stop every later save from running.
        .catch(() => {
          toast.error(t("saveFailed"));
        });
    }

    // Keeps the query string, so an open modal or active filter survives the switch.
    // Read at click time: useSearchParams would opt every static page out of
    // prerendering, since the switcher sits in the header and footer.
    const query = window.location.search;
    startTransition(() => {
      router.replace(`${pathname}${query}`, {
        locale: next,
        scroll: false,
      });
    });
  }

  return { changeLocale, isPending };
}
