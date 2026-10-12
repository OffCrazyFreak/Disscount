import type { formats } from "@/i18n/formats";
import type { AppLocale } from "@/i18n/locales";
import type messages from "@/i18n/messages/hr";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
