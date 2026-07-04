import { ReactNode } from "react";
import { Button, Link, Section, Text } from "react-email";

import type { Locale } from "@/i18n/config";
import type { EmailTranslator } from "@/emails/email-translator";
import EmailLayout from "./email-layout";

interface IActionEmailProps {
  t: EmailTranslator;
  locale: Locale;
  preview: string;
  heading: string;
  intro: ReactNode;
  buttonLabel: string;
  buttonUrl: string;
  footnote: ReactNode;
}

// Shared layout for the single-call-to-action transactional emails (verification, password
// reset, set password, change-email confirmation): a heading, intro copy, one branded button,
// a plain-text fallback link, and a closing footnote.
export default function ActionEmail({
  t,
  locale,
  preview,
  heading,
  intro,
  buttonLabel,
  buttonUrl,
  footnote,
}: IActionEmailProps) {
  return (
    <EmailLayout t={t} locale={locale} preview={preview}>
      <Text className="m-0 mb-2 text-xl font-bold text-gray-800">{heading}</Text>

      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-600">
        {intro}
      </Text>

      <Section className="mb-6">
        <Button
          href={buttonUrl}
          className="box-border rounded-md bg-brand px-6 py-3 text-center text-sm font-semibold text-white no-underline"
        >
          {buttonLabel}
        </Button>
      </Section>

      <Text className="m-0 mb-6 text-xs text-gray-500">
        {t("common.linkFallback")}{" "}
        <Link href={buttonUrl} className="break-all text-brand underline">
          {buttonUrl}
        </Link>
      </Text>

      <Text className="m-0 text-xs text-gray-500">{footnote}</Text>
    </EmailLayout>
  );
}
