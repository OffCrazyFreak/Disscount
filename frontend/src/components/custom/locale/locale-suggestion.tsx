"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useChangeLocale } from "@/components/custom/locale/use-change-locale";
import { browserLocale } from "@/i18n/browser-locale";
import { readLocaleCookie } from "@/i18n/locale-cookie";
import { SHOW_IN_LOCALE } from "@/components/custom/locale/show-in-locale";
import { isLocale, type AppLocale } from "@/i18n/locales";
import { useSession } from "@/lib/auth/client";

const DISMISSED_KEY = "disscount-locale-suggestion-dismissed";

/**
 * A page opened in another language than the saved one (a shared link, a search
 * result) offers the switch instead of redirecting, so every URL keeps meaning
 * one language for crawlers and for whoever shared it. A first visit with nothing
 * saved offers the browser's language the same way.
 */
export default function LocaleSuggestion() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const { data: session } = useSession();
  const { changeLocale, isPending } = useChangeLocale();
  const [preferred, setPreferred] = useState<AppLocale | null>(null);

  const accountLocale = session?.user?.locale;

  useEffect(() => {
    // The cookie and sessionStorage exist only in the browser, so this cannot be
    // derived during render without a hydration mismatch.
    // The cookie first: a switch writes it at once, while the account value lags
    // until the session refetches. Sign-in copies the account value into it.
    const saved =
      readLocaleCookie() ??
      (isLocale(accountLocale) ? accountLocale : null) ??
      browserLocale();
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferred(saved && saved !== locale && !dismissed ? saved : null);
  }, [accountLocale, locale]);

  function dismiss() {
    if (preferred) sessionStorage.setItem(DISMISSED_KEY, preferred);
    setPreferred(null);
  }

  // The live region stays mounted so the offer is announced when it appears.
  // It takes no height and the pill floats over the page top, so a full-height
  // page like the map is never pushed down; it stays under the fixed header.
  return (
    <div role="status" className="relative z-[var(--z-locale-suggestion)] h-0">
      {preferred && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border bg-card py-1 pr-1 pl-3 shadow-md">
            <Languages
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />

            <Button
              variant="link"
              lang={preferred}
              disabled={isPending}
              onClick={() => changeLocale(preferred)}
              className="h-auto min-w-0 p-0 whitespace-normal"
            >
              {SHOW_IN_LOCALE[preferred]}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={dismiss}
              aria-label={t("dismissSuggestion")}
              className="size-8 shrink-0 rounded-full"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
