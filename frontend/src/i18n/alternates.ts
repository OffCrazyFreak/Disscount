import type { Metadata } from "next";
import type { Messages } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { appUrl } from "@/lib/env";
import { getPathname } from "@/i18n/navigation";
import { DEFAULT_LOCALE, LOCALES, type AppLocale } from "@/i18n/locales";

export function localizedUrl(href: string, locale: AppLocale): string {
  return `${appUrl()}${getPathname({ href, locale })}`;
}

/** Google ignores the set unless each version lists itself and all the others. */
export function languageAlternates(href: string): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((locale) => [locale, localizedUrl(href, locale)]),
  );
  languages["x-default"] = localizedUrl(href, DEFAULT_LOCALE);
  return languages;
}

export function pageAlternates(href: string, locale: AppLocale) {
  return {
    canonical: localizedUrl(href, locale),
    languages: languageAlternates(href),
  };
}

type MetaNamespace = {
  [Namespace in keyof Messages]: Messages[Namespace] extends {
    meta: { title: string; description: string };
  }
    ? Namespace
    : never;
}[keyof Messages];

export async function pageMetadata(
  namespace: MetaNamespace,
  href: string,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations(namespace);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates(href, locale),
  };
}
