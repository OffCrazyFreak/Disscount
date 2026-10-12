import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type AppLocale,
} from "@/i18n/locales";

export function readLocaleCookie(): AppLocale | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: AppLocale) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}
