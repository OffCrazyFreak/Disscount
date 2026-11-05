import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";
import { reauthClient } from "@/lib/auth/reauth/reauth-client-plugin";
import { clientEnv } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL:
    clientEnv.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined),
  plugins: [inferAdditionalFields<typeof auth>(), reauthClient()],
});

export const { signIn, useSession } = authClient;
