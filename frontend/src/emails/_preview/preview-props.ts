import { actionEmailFrom, type EmailKind } from "@/lib/email/email-copy";
import type { AppLocale } from "@/i18n/locales";
import hr from "@/i18n/messages/hr";
import en from "@/i18n/messages/en";
import it from "@/i18n/messages/it";
import sl from "@/i18n/messages/sl";
import de from "@/i18n/messages/de";

// Change this to preview every email in another language; the underscore keeps the
// folder out of the preview server's sidebar.
const PREVIEW_LOCALE: AppLocale = "hr";

const CATALOGS = { hr, en, it, sl, de } as Record<AppLocale, typeof hr>;

const PREVIEW_URLS: Record<EmailKind, string> = {
  verification: "https://disscount.me/api/auth/verify-email?token=preview",
  passwordReset: "https://disscount.me/reset-password?token=preview",
  setPassword: "https://disscount.me/reset-password?token=preview",
  changeEmail: "https://disscount.me/api/auth/verify-email?token=preview",
  breachedPassword: "https://disscount.me/reset-password?token=preview",
};

export function previewProps(kind: EmailKind, locale = PREVIEW_LOCALE) {
  return actionEmailFrom(CATALOGS[locale], locale, kind, PREVIEW_URLS[kind], {
    newEmail: "nova.adresa@example.com",
  }).props;
}
