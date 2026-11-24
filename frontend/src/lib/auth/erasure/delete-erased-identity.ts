import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";

// The tombstone check means Next.js can never delete a login whose app data Spring has not erased.
export async function deleteErasedIdentity(userId: string): Promise<void> {
  await db
    .delete(user)
    .where(
      and(
        eq(user.id, userId),
        sql`exists (select 1 from app.erasure_ledger where erasure_ledger.user_id = ${user.id})`,
      ),
    );
}
