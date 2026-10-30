import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TIME_ZONE } from "@/i18n/formatting";
import { loadMessages } from "@/i18n/load-messages";

export default getRequestConfig(async ({ locale }) => {
  // Route handlers and server actions pass the locale explicitly: root params are
  // only readable while rendering.
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (!hasLocale(routing.locales, paramValue)) notFound();
    locale = paramValue;
  }

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: TIME_ZONE,
  };
});
