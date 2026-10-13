import { ReactNode } from "react";
import { Button, Section, Text } from "react-email";

import EmailLayout from "@/emails/components/email-layout";

export interface IActionEmailProps {
  locale: string;
  preview: string;
  heading: string;
  intro: ReactNode;
  buttonLabel: string;
  buttonUrl: string;
  fallback: ReactNode;
  footnote: string;
  footer: ReactNode;
}

// Shared by every single-call-to-action transactional email.
export default function ActionEmail({
  locale,
  preview,
  heading,
  intro,
  buttonLabel,
  buttonUrl,
  fallback,
  footnote,
  footer,
}: IActionEmailProps) {
  return (
    <EmailLayout locale={locale} preview={preview} footer={footer}>
      <Text className="m-0 mb-2 text-xl font-bold text-gray-800">
        {heading}
      </Text>

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

      <Text className="m-0 mb-6 text-xs text-gray-500">{fallback}</Text>

      <Text className="m-0 text-xs text-gray-500">{footnote}</Text>
    </EmailLayout>
  );
}
