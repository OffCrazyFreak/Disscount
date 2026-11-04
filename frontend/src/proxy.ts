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

// Next advertises share images with the locale prefix even for Croatian, and preview bots may drop an image behind the redirect to the bare URL.
const PREFIXED_SHARE_IMAGE_PATH = new RegExp(
  `^/(?:${LOCALES.join("|")})/(?:opengraph-image|twitter-image)(?:/|$)`,
);

function hasValidEscapes(segment: string): boolean {
  try {
    decodeURIComponent(segment);
    return true;
  } catch {
    return false;
  }
}

/** loading.tsx streams a 200 before the page can look a product up, so only a check here can send a real 404. */
function malformedProductResponse(request: NextRequest): NextResponse | null {
  const match = PRODUCT_PATH.exec(request.nextUrl.pathname);
  if (!match) return null;

  // Next cannot route a broken percent escape at all, so it gets a bare 404.
  if (!hasValidEscapes(match[2]))
    return new NextResponse(null, { status: 404 });
  if (isWellFormedProductId(decodeProductId(match[2]))) return null;

  const locale = match[1] ?? DEFAULT_LOCALE;
  // Any unmatched path under the locale reaches [...rest], which renders the localised 404.
  return NextResponse.rewrite(new URL(`/${locale}/404`, request.url), {
    status: 404,
  });
}

export default function proxy(request: NextRequest) {
  // The image routes read the locale from their own params, so they need nothing from next-intl.
  if (PREFIXED_SHARE_IMAGE_PATH.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Only the bare root follows a saved choice; crawlers carry no cookie, and every other URL keeps its own language.
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
  // Skips API and auth routes, Next internals, the Sentry tunnel, handlers outside [locale] and files with an extension.
  matcher: [
    "/((?!api|_next|_vercel|monitoring|health|share-target|.*\\..*).*)",
  ],
};
