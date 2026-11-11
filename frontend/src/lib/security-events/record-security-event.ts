import "server-only";

import { db } from "@/db";
import { securityEvent } from "@/db/security-event-schema";
import { trustedClientMeta } from "@/lib/client-ip/client-ip";
import { hashTypedEmail } from "@/lib/security-events/subject-hash";
import {
  SECURITY_EVENT_OUTCOMES,
  type SecurityEventPayload,
  type SecurityEventType,
} from "@/lib/security-events/security-event-vocabulary";

const USER_AGENT_MAX_LENGTH = 256;

interface ISecurityEventBase {
  userId?: string | null;
  headers?: Headers | null;
  // Only on a failed sign-in, where no account is known; stored as a keyed hash.
  typedEmail?: string;
}

type SecurityEventInput<E extends SecurityEventType> = ISecurityEventBase &
  ([SecurityEventPayload<E>] extends [never]
    ? { payload?: never }
    : { payload: SecurityEventPayload<E> });

/** Fails open: the action it records has already happened, so a broken log never fails the request. */
export async function recordSecurityEvent<E extends SecurityEventType>(
  eventType: E,
  input: SecurityEventInput<E>,
) {
  try {
    const { ipAddress, country } = trustedClientMeta(input.headers);
    const userAgent =
      input.headers?.get("user-agent")?.slice(0, USER_AGENT_MAX_LENGTH) ?? null;

    await db.insert(securityEvent).values({
      eventType,
      outcome: SECURITY_EVENT_OUTCOMES[eventType],
      userId: input.userId ?? null,
      subjectHash: input.typedEmail ? hashTypedEmail(input.typedEmail) : null,
      ipAddress,
      userAgent,
      country,
      payload: input.payload ?? {},
    });
  } catch (error) {
    console.error(
      `Failed to record security event ${eventType}:`,
      error instanceof Error ? error.name : typeof error,
    );
  }
}
