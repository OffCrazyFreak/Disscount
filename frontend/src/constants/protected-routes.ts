// Logging out bounces the user home from any of these, or their detail pages.
export const PROTECTED_ROUTE_PREFIXES = [
  "/shopping-lists",
  "/watchlist",
  "/digital-cards",
  "/spending",
  "/dashboard",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
