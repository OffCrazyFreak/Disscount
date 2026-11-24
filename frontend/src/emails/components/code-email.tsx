import { ReactNode } from "react";
import { Section, Text } from "react-email";

import EmailLayout from "@/emails/components/email-layout";

export interface ICodeEmailProps {
  locale: string;
  preview: string;
  heading: string;
  intro: string;
  code: string;
  footnote: string;
  footer: ReactNode;
}

// A one-time code to type back into the app, so there is no button to click.
export default function CodeEmail({
  locale,
  preview,
  heading,
  intro,
  code,
  footnote,
  footer,
}: ICodeEmailProps) {
  return (
    <EmailLayout locale={locale} preview={preview} footer={footer}>
      <Text className="m-0 mb-2 text-xl font-bold text-gray-800">
        {heading}
      </Text>

      <Text className="m-0 mb-6 text-sm leading-relaxed text-gray-600">
        {intro}
      </Text>

      <Section className="mb-6 rounded-md bg-gray-100 py-4 text-center">
        <Text className="m-0 font-mono text-3xl font-bold tracking-widest text-gray-800">
          {code}
        </Text>
      </Section>

      <Text className="m-0 text-xs text-gray-500">{footnote}</Text>
    </EmailLayout>
  );
}
