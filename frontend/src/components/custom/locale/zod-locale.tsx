"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { z } from "zod";

import type { AppLocale } from "@/i18n/locales";

const ZOD_LOCALES: Record<AppLocale, () => Parameters<typeof z.config>[0]> = {
  hr: z.locales.hr,
  en: z.locales.en,
  it: z.locales.it,
  sl: z.locales.sl,
  de: z.locales.de,
};

/**
 * Zod's built-in messages ("Too small: expected...") follow the page language.
 * z.config is process-global, so this only ever runs in the browser, never on a
 * server handling several languages at once.
 */
export default function ZodLocale() {
  const locale = useLocale();

  useEffect(() => {
    z.config(ZOD_LOCALES[locale]());
  }, [locale]);

  return null;
}
