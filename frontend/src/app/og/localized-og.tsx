import { getTranslations } from "next-intl/server";

import renderBrandOg, { contentType, size } from "@/app/og/render-og";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/locales";

// Image routes are route handlers, where root params are unreadable, so the locale
// comes from the route's own params.
async function metadataTranslator(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  return getTranslations({
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    namespace: "metadata.og",
  });
}

export async function localizedOgMetadata(params: Promise<{ locale: string }>) {
  const t = await metadataTranslator(params);
  return [{ id: "brand", alt: t("alt"), size, contentType }];
}

export async function renderLocalizedOg(params: Promise<{ locale: string }>) {
  const t = await metadataTranslator(params);
  return renderBrandOg({ headline: t("headline"), cta: t("cta") });
}
