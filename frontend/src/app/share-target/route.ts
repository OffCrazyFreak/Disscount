import { NextRequest, NextResponse } from "next/server";

// PWA share target (see manifest.ts `share_target`). When a user shares text, a
// title, or a URL from another app into Disscount, funnel the shared string into
// product search so it becomes the query.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const shared = (
    params.get("text") ||
    params.get("title") ||
    params.get("url") ||
    ""
  ).trim();

  const target = new URL("/products", request.nextUrl.origin);
  if (shared) target.searchParams.set("q", shared);

  return NextResponse.redirect(target);
}
