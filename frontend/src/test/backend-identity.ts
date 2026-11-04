import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import {
  decideIdentity,
  identityPin,
  isCsrfSafe,
} from "@/lib/backend-proxy/request-guards";

export const ANONYMOUS = "anonymous";

/** The account the session cookie names on the server. The DOM setup clears it after each test. */
export const serverSession = { userId: null as string | null };

/** A call the proxy would refuse throws the proxy's answer, which MSW sends back, so it never reaches the handler body. */
export function actingAs(request: Request): string {
  if (!isCsrfSafe(request, window.location.origin)) {
    throw proxyProblem("csrf_rejected", request);
  }

  const identity = decideIdentity(identityPin(request), serverSession.userId);
  if (identity.action === "refuse")
    throw proxyProblem("session_changed", request);
  return identity.asUser ?? ANONYMOUS;
}
