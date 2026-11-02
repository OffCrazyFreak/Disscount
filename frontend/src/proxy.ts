import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALES,
} from "@/i18n/locales";
import { decodeProductId, isWellFormedProductId } from "@/utils/product-id";

const intlMiddleware = createMiddleware(routing);

const PRODUCT_PATH = new RegExp(
  `^(?:/(${LOCALES.join("|")}))?/products/([^/]+)/?$`,
);

/**
 * loading.tsx streams a 200 before the page can look a product up, so only a check
 * here can send a real 404. It stays a shape check: the upstream lookup happens in
 * the page, whose notFound() then gets Next's streamed noindex.
 */
function malformedProductResponse(request: NextRequest): NextResponse | null {
  const match = PRODUCT_PATH.exec(request.nextUrl.pathname);
  if (!match) return null;

  const id = decodeProductId(match[2]);
  // Next cannot route a broken percent escape at all, so it gets a bare 404.
  if (id === null) return new NextResponse(null, { status: 404 });
  if (isWellFormedProductId(id)) return null;

  const locale = match[1] ?? DEFAULT_LOCALE;
  // Any unmatched path under the locale reaches [...rest], which renders the localised 404.
  return NextResponse.rewrite(new URL(`/${locale}/404`, request.url), {
    status: 404,
  });
}

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

  return malformedProductResponse(request) ?? intlMiddleware(request);
}

export const config = {
  // Skips API and auth routes, Next internals, the Sentry tunnel, route handlers
  // that live outside [locale], and anything with a file extension (sw.js,
  // manifest.webmanifest, sitemap.xml, images).
  matcher: [
    "/((?!api|_next|_vercel|monitoring|health|share-target|.*\\..*).*)",
  ],
};
