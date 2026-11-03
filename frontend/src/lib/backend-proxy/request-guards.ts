import {
  CLIENT_HEADER,
  CLIENT_HEADER_VALUE,
  USER_HEADER,
} from "@/lib/backend-proxy/proxy-contract";
import { ANONYMOUS_IDENTITY } from "@/lib/offline/cache-identity";

const SAFE_METHODS = new Set(["GET", "HEAD"]);

/**
 * The session cookie rides along on any request to our origin, so the proxy needs its own
 * CSRF check. SameSite=Lax alone lets a sibling subdomain through; the custom header and
 * Sec-Fetch-Site close that, and the header is required on GET too so a top-level
 * navigation to an API URL never runs as the signed-in account.
 */
export function isCsrfSafe(request: Request, appOrigin: string): boolean {
  const { headers } = request;
  if (headers.get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE) return false;

  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") return false;

  const origin = headers.get("origin");
  return SAFE_METHODS.has(request.method) || !origin || origin === appOrigin;
}

export type IdentityDecision =
  { action: "forward"; asUser: string | null } | { action: "refuse" };

/**
 * Compares the tab's pin with the account the session cookie names. Only a request that
 * would run as a different account than the tab believes is refused. A pin naming an
 * account whose session has ended goes on anonymously, as it did with a browser token:
 * there is no account to cross into, and public routes and shared lists keep loading.
 */
export function decideIdentity(
  pin: string | null,
  sessionUserId: string | null,
): IdentityDecision {
  if (!sessionUserId) return { action: "forward", asUser: null };
  if (pin === sessionUserId)
    return { action: "forward", asUser: sessionUserId };
  return { action: "refuse" };
}

export function identityPin(request: Request): string | null {
  const pin = request.headers.get(USER_HEADER);
  return pin && pin !== ANONYMOUS_IDENTITY ? pin : null;
}
