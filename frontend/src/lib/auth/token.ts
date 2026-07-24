import * as Sentry from "@sentry/nextjs";

import { authClient } from "@/lib/auth/client";

const SERVER_ERROR_STATUS = 500;

export default async function fetchAuthToken(): Promise<string | null> {
  const { data, error } = await authClient.$fetch<{ token: string }>("/token", {
    method: "GET",
  });

  if (error && error.status >= SERVER_ERROR_STATUS) {
    Sentry.captureException(
      new Error(
        `Auth token request failed: ${error.status} ${error.statusText}`,
      ),
    );
  }

  return data?.token ?? null;
}
