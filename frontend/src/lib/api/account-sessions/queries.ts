import { z } from "zod";

import {
  accountSessionDtoSchema,
  type AccountSessionDto,
} from "@/lib/api/schemas/account-session";

// Next routes, not Spring: they read better-auth's session table by the cookie's user.
const BASE_PATH = "/api/account/sessions";

export async function getAccountSessions(): Promise<AccountSessionDto[]> {
  const response = await fetch(BASE_PATH, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sessions request failed: ${response.status}`);

  return z.array(accountSessionDtoSchema).parse(await response.json());
}

export async function revokeAccountSession(id: string): Promise<void> {
  const response = await fetch(`${BASE_PATH}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  // Already gone, for instance signed out on that device meanwhile: the goal is met.
  if (!response.ok && response.status !== 404) {
    throw new Error(`Session revoke failed: ${response.status}`);
  }
}
