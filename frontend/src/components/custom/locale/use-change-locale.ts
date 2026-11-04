"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";
import { writeLocaleCookie } from "@/i18n/locale-cookie";
import type { AppLocale } from "@/i18n/locales";
import { useSession } from "@/lib/auth/client";
import { queueAccountLocaleSave } from "@/components/custom/locale/account-locale-save";

export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("locale");

  function changeLocale(next: AppLocale) {
    writeLocaleCookie(next);

    if (session?.user) {
      // Always saved, because the session lags behind a quick second switch, and sign-in copies the account value back over the cookie.
      queueAccountLocaleSave(session.user.id, next, () =>
        toast.error(t("saveFailed")),
      );
    }

    // Read at click time, because useSearchParams would opt every static page out of prerendering, since the switcher is in the header and footer.
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
