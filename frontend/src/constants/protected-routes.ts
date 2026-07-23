// User-specific pages that make no sense when logged out. On logout the user is
// bounced to the homepage from any of these (or their detail pages). Add new
// user-only route prefixes here as the app grows.
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
