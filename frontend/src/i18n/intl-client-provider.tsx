"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";

import { TIME_ZONE } from "./config";
import { getMessageFallback, onIntlError } from "./message-fallback";

type ProviderProps = ComponentProps<typeof NextIntlClientProvider>;

interface IntlClientProviderProps {
  locale: ProviderProps["locale"];
  messages: ProviderProps["messages"];
  children: ReactNode;
}

// Wraps NextIntlClientProvider so the graceful hr fallback + non-throwing error
// handler also apply on the client. These are functions and can't be passed
// across the server/client boundary, so they're wired here in a client module.
export function IntlClientProvider({
  locale,
  messages,
  children,
}: IntlClientProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={TIME_ZONE}
      onError={onIntlError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}
