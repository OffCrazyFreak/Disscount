import {
  CLIENT_HEADER,
  CLIENT_HEADER_VALUE,
  USER_HEADER,
} from "@/lib/backend-proxy/proxy-contract";
import { ANONYMOUS_IDENTITY } from "@/lib/offline/cache-identity";

const SAFE_METHODS = new Set(["GET", "HEAD"]);

/** SameSite=Lax admits sibling subdomains; the header is required on GET so navigation cannot act as the account. */
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

/** Only a different account is refused; an ended session's pin goes on anonymously, so public routes load. */
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
