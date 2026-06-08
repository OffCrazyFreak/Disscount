import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

/**
 * Browser-side better-auth client. `jwtClient` exposes `authClient.token()`,
 * which returns a short-lived JWT we attach as a Bearer token to the Spring
 * backend (validated there via JWKS).
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
