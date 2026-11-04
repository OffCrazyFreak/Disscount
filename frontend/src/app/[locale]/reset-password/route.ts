import { hasLocale } from "next-intl";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { localePath } from "@/i18n/locale-path";
import { routing } from "@/i18n/routing";

// A route handler, because [locale]/loading.tsx turns a page redirect into a client navigation, so the token would reach Sentry Replay unstripped.
export async function GET(
  request: Request,
  context: RouteContext<"/[locale]/reset-password">,
) {
  const { locale } = await context.params;
  const token = new URL(request.url).searchParams.get("token");

  const query = token
    ? `?modal=reset-password&token=${encodeURIComponent(token)}`
    : "?modal=reset-password";

  const appLocale = hasLocale(routing.locales, locale)
    ? locale
    : DEFAULT_LOCALE;

  // A relative Location, so the redirect never depends on the Host seen behind Traefik.
  return new Response(null, {
    status: 307,
    headers: { Location: localePath(appLocale, `/${query}`) },
  });
}
