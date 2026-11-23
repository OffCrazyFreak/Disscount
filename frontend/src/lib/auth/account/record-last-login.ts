import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";

interface ICreatedSession {
  userId: string;
  createdAt: Date;
}

// The sign-in has already succeeded, so a failed write is logged rather than thrown.
export async function recordLastLogin(session: ICreatedSession) {
  try {
    await db
      .update(user)
      .set({ lastLoginAt: session.createdAt })
      .where(eq(user.id, session.userId));
  } catch (error) {
    console.error(
      "Failed to record last login:",
      error instanceof Error ? error.name : typeof error,
    );
  }
}
