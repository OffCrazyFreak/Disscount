import "server-only";

import { createHmac } from "node:crypto";

import { serverEnv } from "@/lib/server-env";

// A sub-key of the auth secret, so no new variable is needed and the hash shares no key with any other.
const SUBJECT_HASH_KEY = createHmac("sha256", serverEnv.BETTER_AUTH_SECRET)
  .update("security-event-subject")
  .digest();

// Keyed, so a leaked table cannot be reversed by hashing a list of known addresses.
export function hashTypedEmail(email: string) {
  return createHmac("sha256", SUBJECT_HASH_KEY)
    .update(email.trim().toLowerCase())
    .digest("hex");
}
