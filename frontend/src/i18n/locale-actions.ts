"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

// Persists the chosen locale in the NEXT_LOCALE cookie so it survives reloads and
// is available to the request config on the next render. The switcher calls this,
// then refreshes the router to re-render with the new locale.
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
