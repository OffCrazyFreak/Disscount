import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Security headers are now handled in next.config.ts headers() function
  // This middleware can be removed if no other logic is needed
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
