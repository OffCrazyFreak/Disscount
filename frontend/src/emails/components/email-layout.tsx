import { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "react-email";

import type { Locale } from "@/i18n/config";
import type { EmailTranslator } from "@/emails/email-translator";

// Accessible representative of the app's green --primary (oklch ~141 hue) as a hex email
// clients understand. Deep enough that white button text stays legible.
const BRAND = "#16a34a";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://disscount.me";

interface IEmailLayoutProps {
  t: EmailTranslator;
  locale: Locale;
  preview: string;
  children: ReactNode;
}

// Shared shell for every transactional email: brand wordmark, the message body, and a footer
// that always links back to the app where the user can manage their email preferences.
export default function EmailLayout({
  t,
  locale,
  preview,
  children,
}: IEmailLayoutProps) {
  return (
    <Html lang={locale}>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: { extend: { colors: { brand: BRAND } } },
        }}
      >
        <Head />
        <Body className="bg-gray-100 font-sans">
          <Preview>{preview}</Preview>

          <Container className="mx-auto my-8 max-w-xl rounded-lg border border-solid border-gray-200 bg-white p-8">
            <Text className="m-0 mb-6 text-2xl font-bold text-brand">
              disscount
            </Text>

            {children}

            <Hr className="my-6 border-solid border-gray-200" />

            <Text className="m-0 text-xs text-gray-500">
              {t.rich("common.footerNotice", {
                link: (chunks) => (
                  <Link href={APP_URL} className="text-brand underline">
                    {chunks}
                  </Link>
                ),
              })}
            </Text>

            <Text className="m-0 mt-2 text-xs text-gray-400">
              © {new Date().getFullYear()} Disscount
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
