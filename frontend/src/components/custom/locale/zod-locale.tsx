"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { z } from "zod";
import de from "zod/v4/locales/de.js";
import en from "zod/v4/locales/en.js";
import hr from "zod/v4/locales/hr.js";
import it from "zod/v4/locales/it.js";
import sl from "zod/v4/locales/sl.js";

import type { AppLocale } from "@/i18n/locales";

// One file per language, as z.locales would pull every zod locale into each route.
const ZOD_LOCALES: Record<AppLocale, () => Parameters<typeof z.config>[0]> = {
  hr,
  en,
  it,
  sl,
  de,
};

/** z.config is process-global, so this only runs in the browser, never on a server handling several languages. */
export default function ZodLocale() {
  const locale = useLocale();

  useEffect(() => {
    z.config(ZOD_LOCALES[locale]());
  }, [locale]);

  return null;
}
