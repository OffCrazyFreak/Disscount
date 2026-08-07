import { isRouteActive } from "@/utils/routes";

// Logging out bounces the user home from any of these, or their detail pages.
//
// `/shopping-lists` stays here for that bounce even though a list detail page is now
// reachable signed out: the index behind it is not, and landing on a login gate is worse
// than one extra navigation for the rarer case of signing out while reading someone
// else's list. It is deliberately no longer used for the robots disallow, which wants the
// opposite answer. See app/robots.ts.
export const PROTECTED_ROUTE_PREFIXES = [
  "/shopping-lists",
  "/watchlist",
  "/digital-cards",
  "/spending",
  "/dashboard",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    isRouteActive(pathname, prefix),
  );
}
