import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { TIME_ZONE } from "@/i18n/formatting";
import type { AppLocale } from "@/i18n/locales";
import de from "@/i18n/messages/de";
import en from "@/i18n/messages/en";
import hr from "@/i18n/messages/hr";
import it from "@/i18n/messages/it";
import sl from "@/i18n/messages/sl";

const CATALOGS: Record<AppLocale, typeof hr> = { hr, en, it, sl, de };

interface IProviderOptions {
  locale?: AppLocale;
  queryClient?: QueryClient;
}

// Retries off so a failing request fails the test at once instead of after backoff.
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function providers({
  locale = "hr",
  queryClient = createTestQueryClient(),
}: IProviderOptions) {
  // <html lang> is what the API client sends as Accept-Language.
  document.documentElement.lang = locale;

  return function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale={locale}
          messages={CATALOGS[locale]}
          timeZone={TIME_ZONE}
        >
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  };
}

/** Renders inside the app's real providers, with the real catalogs, in Croatian by default. */
export function renderWithProviders(
  ui: ReactElement,
  options: IProviderOptions = {},
) {
  return render(ui, { wrapper: providers(options) });
}

export function renderHookWithProviders<T>(
  hook: () => T,
  options: IProviderOptions = {},
) {
  return renderHook(hook, { wrapper: providers(options) });
}
