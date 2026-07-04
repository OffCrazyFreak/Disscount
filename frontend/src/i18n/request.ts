import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  matchLocale,
  TIME_ZONE,
} from "./config";
import { getMessageFallback, onIntlError } from "./message-fallback";

// Resolves the active locale per request. Priority:
//   1. NEXT_LOCALE cookie: the user's explicit choice (set by the switcher)
//   2. Accept-Language header: the browser's preference on the first visit
//   3. defaultLocale
// Reading the cookie/headers opts pages into dynamic rendering, which is
// expected for cookie-based i18n without routing.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;

  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : (matchLocale((await headers()).get("accept-language")) ?? defaultLocale);

  return {
    locale,
    timeZone: TIME_ZONE,
    messages: (await import(`./messages/${locale}.json`)).default,
    getMessageFallback,
    onError: onIntlError,
  };
});
