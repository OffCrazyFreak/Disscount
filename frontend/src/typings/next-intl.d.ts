import type { Locale } from "@/i18n/config";
import type messages from "@/i18n/messages/hr.json";

// Augments next-intl with our app's locale + message shape so `useTranslations`,
// `getTranslations`, and `useLocale` are fully type-checked. hr.json is the
// reference catalog; every other locale must mirror its keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
