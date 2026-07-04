import { createTranslator } from "next-intl";
import type { ReactNode } from "react";

import { defaultLocale, TIME_ZONE, type Locale } from "@/i18n/config";
import hr from "@/i18n/messages/hr.json";
import en from "@/i18n/messages/en.json";
import de from "@/i18n/messages/de.json";
import sl from "@/i18n/messages/sl.json";

const MESSAGES = { hr, en, de, sl };

// Loose translator shape for the email templates: plain lookups plus t.rich for
// the few messages with an inline link or bold value. Email keys are few, so we
// forgo compile-time key typing here (createTranslator is cast to this).
export interface EmailTranslator {
  (key: string, values?: Record<string, string | number>): string;
  rich(
    key: string,
    values?: Record<
      string,
      ((chunks: ReactNode) => ReactNode) | string | number
    >,
  ): ReactNode;
}

// Builds a translator bound to the recipient's locale and the "emails" namespace.
// Synchronous and usable outside a request, since email sending isn't tied to the
// i18n request config (unlike getTranslations).
export function getEmailTranslator(locale: Locale): EmailTranslator {
  const messages = (MESSAGES[locale] ?? MESSAGES[defaultLocale]) as typeof hr;

  return createTranslator({
    locale,
    timeZone: TIME_ZONE,
    messages,
    namespace: "emails",
  }) as unknown as EmailTranslator;
}
