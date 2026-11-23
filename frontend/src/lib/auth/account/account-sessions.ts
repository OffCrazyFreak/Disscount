import "server-only";

import Bowser from "bowser";
import { and, desc, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { session } from "@/db/auth-schema";
import type { AccountSessionDto } from "@/lib/api/schemas/account-session";

const DEVICE_TYPES = new Set(["mobile", "tablet", "desktop"]);

function describeDevice(userAgent: string | null) {
  if (!userAgent) return { browser: null, os: null, deviceType: null };

  const parsed = Bowser.parse(userAgent);
  const type = parsed.platform.type;

  // bowser answers "" for a part it cannot read, which the list treats as unknown.
  return {
    browser: parsed.browser.name || null,
    os: parsed.os.name || null,
    deviceType:
      type && DEVICE_TYPES.has(type)
        ? (type as AccountSessionDto["deviceType"])
        : null,
  };
}

export async function listAccountSessions(
  userId: string,
  currentSessionId: string,
): Promise<AccountSessionDto[]> {
  const rows = await db
    .select({
      id: session.id,
      userAgent: session.userAgent,
      country: session.country,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.updatedAt));

  const sessions = rows.map((row) => ({
    id: row.id,
    isCurrent: row.id === currentSessionId,
    ...describeDevice(row.userAgent),
    country: row.country,
    // better-auth rewrites updatedAt at most once a day, so this is coarse on purpose.
    lastActiveAt: (row.updatedAt > row.createdAt
      ? row.updatedAt
      : row.createdAt
    ).toISOString(),
  }));

  return sessions.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
}

export async function revokeAccountSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(session)
    .where(and(eq(session.id, sessionId), eq(session.userId, userId)))
    .returning({ id: session.id });

  return deleted.length > 0;
}
