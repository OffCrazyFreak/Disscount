import { isRouteActive } from "@/utils/routes";

// Stays for the logout bounce, as a login gate is worse; app/robots.ts wants the opposite answer.
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
