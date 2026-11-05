import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/locales";

// Turns anything shared into Disscount (see manifest.ts) into a product search.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const shared = (
    params.get("text") ||
    params.get("title") ||
    params.get("url") ||
    ""
  ).trim();

  // The share sheet always posts to this one unprefixed URL, so the saved choice
  // decides the language of the results page.
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const prefix = isLocale(saved) && saved !== DEFAULT_LOCALE ? `/${saved}` : "";

  const target = new URL(`${prefix}/products`, request.nextUrl.origin);
  if (shared) target.searchParams.set("q", shared);

  return NextResponse.redirect(target);
}
