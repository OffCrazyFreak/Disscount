"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { writeLocaleCookie } from "@/i18n/locale-cookie";
import type { AppLocale } from "@/i18n/locales";
import { authClient, useSession } from "@/lib/auth/client";

// An explicit pick: remembered on this device and, when signed in, on the account.
export function useChangeLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  function changeLocale(next: AppLocale) {
    writeLocaleCookie(next);

    if (session?.user && session.user.locale !== next) {
      void authClient.updateUser({ locale: next });
    }

    // Keeps the query string, so an open modal or active filter survives the switch.
    const query = searchParams.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        locale: next,
        scroll: false,
      });
    });
  }

  return { changeLocale, isPending };
}
