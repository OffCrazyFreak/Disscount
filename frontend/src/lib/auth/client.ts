import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";
import { reauthClient } from "@/lib/auth/reauth/reauth-client-plugin";
import { clientEnv } from "@/lib/env";

// The list pages' wait in sw.ts: on a weak signal the check fails and the saved account data shows.
const SESSION_LOOKUP_TIMEOUT_MS = 5_000;

interface ISessionLookupRequest {
  url: URL | string;
  method: string;
  signal?: AbortSignal | null;
}

/** Only the session hook's lookups: they always pass a signal, which makes better-fetch ignore its own timeout. */
function withSessionLookupTimeout<T extends ISessionLookupRequest>(request: T) {
  const path = String(request.url).split("?")[0];
  if (request.method !== "GET" || !path.endsWith("/get-session")) return;

  // A direct getSession() call, as after a sign-in, keeps waiting: a timeout there would report a good login as failed.
  if (!request.signal) return;

  // Older Safari lacks these; there the lookup keeps waiting as before.
  if (typeof AbortSignal.any !== "function" || !AbortSignal.timeout) return;

  const timeout = AbortSignal.timeout(SESSION_LOOKUP_TIMEOUT_MS);
  return { ...request, signal: AbortSignal.any([request.signal, timeout]) };
}

export const authClient = createAuthClient({
  baseURL:
    clientEnv.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined),
  plugins: [inferAdditionalFields<typeof auth>(), reauthClient()],
  fetchOptions: { onRequest: withSessionLookupTimeout },
});

export const { signIn, useSession } = authClient;
