import { cookies, headers } from "next/headers";

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  matchLocale,
  type Locale,
} from "./config";

// Server-side locale resolution for non-render contexts (e.g. sending a
// transactional email from a route handler). Same priority as request.ts:
// NEXT_LOCALE cookie, then the Accept-Language header, then the default.
export async function getRequestLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  return matchLocale((await headers()).get("accept-language")) ?? defaultLocale;
}
