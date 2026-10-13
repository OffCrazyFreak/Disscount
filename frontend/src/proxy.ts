import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/locales";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Only the bare root follows a saved choice: typing the domain or launching the
  // installed app lands there. Crawlers never carry the cookie, and every other URL
  // keeps showing its own language.
  if (request.nextUrl.pathname === "/") {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;

    if (isLocale(saved) && saved !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = `/${saved}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Skips API and auth routes, Next internals, the Sentry tunnel, route handlers
  // that live outside [locale], and anything with a file extension (sw.js,
  // manifest.webmanifest, sitemap.xml, images).
  matcher: [
    "/((?!api|_next|_vercel|monitoring|health|share-target|.*\\..*).*)",
  ],
};
