import { createElement, type ReactNode } from "react";
import { createTranslator } from "next-intl";
import { Link } from "react-email";

import type { IActionEmailProps } from "@/emails/components/action-email";
import { DEFAULT_LOCALE, isLocale, type AppLocale } from "@/i18n/locales";
import type hrMessages from "@/i18n/messages/hr";
import { loadMessages } from "@/i18n/load-messages";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://disscount.me";

type EmailKind =
  "verification" | "passwordReset" | "setPassword" | "changeEmail";

// A null or unknown stored locale falls back to Croatian rather than failing a send.
export function resolveLocale(value: unknown): AppLocale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// better-auth does not type additionalFields inside its own hooks, so read it defensively.
export function userLocale(user: object | null | undefined): AppLocale {
  return resolveLocale(user && "locale" in user ? user.locale : undefined);
}

function linkTo(href: string) {
  return function renderLink(chunks: ReactNode) {
    return createElement(
      Link,
      { href, className: "break-all text-brand underline" },
      chunks,
    );
  };
}

export async function buildActionEmail(
  locale: AppLocale,
  kind: EmailKind,
  url: string,
  values: { newEmail?: string } = {},
): Promise<{ subject: string; props: IActionEmailProps }> {
  const t = createTranslator({
    locale,
    messages: (await loadMessages(locale)) as typeof hrMessages,
    namespace: "emails",
  });

  const intro =
    kind === "changeEmail"
      ? t.rich("changeEmail.intro", {
          newEmail: values.newEmail ?? "",
          email: (chunks) =>
            createElement(
              "span",
              { className: "font-semibold text-gray-800" },
              chunks,
            ),
        })
      : t(`${kind}.intro`);

  return {
    subject: t(`${kind}.subject`),
    props: {
      locale,
      preview: t(`${kind}.preview`),
      heading: t(`${kind}.heading`),
      intro,
      buttonLabel: t(`${kind}.button`),
      buttonUrl: url,
      fallback: t.rich("layout.fallback", { url, link: linkTo(url) }),
      footnote: t(`${kind}.footnote`),
      footer: t.rich("layout.footer", { link: linkTo(APP_URL) }),
    },
  };
}
