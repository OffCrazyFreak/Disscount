import { NextRequest, NextResponse } from "next/server";

// Turns anything shared into Disscount (see manifest.ts) into a product search.
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
