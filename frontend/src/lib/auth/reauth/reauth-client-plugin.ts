import type { BetterAuthClientPlugin } from "better-auth/client";

import type { reauth } from "@/lib/auth/reauth/reauth-plugin";

const PROOF_PATHS = new Set(["/reauth/verify-password", "/reauth/verify-code"]);

// Types authClient.reauth.*; a proof swaps the session, so session hooks refetch.
export function reauthClient() {
  return {
    id: "reauth",
    $InferServerPlugin: {} as ReturnType<typeof reauth>,
    atomListeners: [
      {
        matcher: (path) => PROOF_PATHS.has(path),
        signal: "$sessionSignal",
      },
    ],
  } satisfies BetterAuthClientPlugin;
}
