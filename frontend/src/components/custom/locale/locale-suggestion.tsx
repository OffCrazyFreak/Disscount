"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useChangeLocale } from "@/components/custom/locale/use-change-locale";
import { readLocaleCookie } from "@/i18n/locale-cookie";
import { isLocale, SHOW_IN_LOCALE, type AppLocale } from "@/i18n/locales";
import { useSession } from "@/lib/auth/client";

const DISMISSED_KEY = "disscount-locale-suggestion-dismissed";

/**
 * A page opened in another language than the saved one (a shared link, a search
 * result) offers the switch instead of redirecting, so every URL keeps meaning
 * one language for crawlers and for whoever shared it.
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
    const saved = isLocale(accountLocale) ? accountLocale : readLocaleCookie();
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferred(saved && saved !== locale && !dismissed ? saved : null);
  }, [accountLocale, locale]);

  if (!preferred) return null;

  function dismiss() {
    if (preferred) sessionStorage.setItem(DISMISSED_KEY, preferred);
    setPreferred(null);
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border bg-card p-2 pl-3 shadow-sm">
      <Languages aria-hidden="true" className="size-4 text-muted-foreground" />

      <Button
        variant="link"
        lang={preferred}
        disabled={isPending}
        onClick={() => changeLocale(preferred)}
        className="h-auto flex-1 justify-start p-0"
      >
        {SHOW_IN_LOCALE[preferred]}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={dismiss}
        aria-label={t("dismissSuggestion")}
        className="size-8"
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
