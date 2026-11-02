import "server-only";

import { createHmac } from "node:crypto";

import { requireEnv } from "@/lib/env";
import { inboxKey } from "@/lib/email/recipient-send-cap";

// A sub-key of the auth secret, so this hash never shares a key with better-auth's own signatures.
const RECIPIENT_HASH_KEY = createHmac(
  "sha256",
  requireEnv("BETTER_AUTH_SECRET"),
)
  .update("email-send-log")
  .digest();

// Keyed, so a leaked email_send table cannot be reversed by hashing a list of known addresses.
export function hashRecipient(recipient: string) {
  return createHmac("sha256", RECIPIENT_HASH_KEY)
    .update(inboxKey(recipient))
    .digest("hex");
}
