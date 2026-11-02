import "server-only";

import { createHmac } from "node:crypto";

import { requireEnv } from "@/lib/env";
import { inboxKey } from "@/lib/email/recipient-send-cap";

const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");

// Keyed, so a leaked email_send table cannot be reversed by hashing a list of known addresses.
export function hashRecipient(recipient: string) {
  return createHmac("sha256", BETTER_AUTH_SECRET)
    .update(inboxKey(recipient))
    .digest("hex");
}
