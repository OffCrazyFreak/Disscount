import "server-only";

import { and, count, desc, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailSend } from "@/db/email-send-schema";
import { hashRecipient } from "@/lib/email/recipient-hash";
import {
  hasRecipientBudget,
  IRecipientSendGate,
} from "@/lib/email/recipient-send-cap";

// Postgres-backed so the cap holds across deploys and every route bundle.
export const recipientSendLog: IRecipientSendGate = {
  async tryReserve(recipient) {
    const recipientHash = hashRecipient(recipient);
    const dayAgo = sql`now() - interval '1 day'`;

    const reserved = await db.transaction(async (tx) => {
      // Serialises concurrent sends to one address, so two requests cannot both read the last free slot.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${recipientHash}))`,
      );

      const [counts] = await tx
        .select({
          lastHour: count(
            sql`case when ${emailSend.sentAt} > now() - interval '1 hour' then 1 end`,
          ),
          lastDay: count(),
        })
        .from(emailSend)
        .where(
          and(
            eq(emailSend.recipientHash, recipientHash),
            gt(emailSend.sentAt, dayAgo),
          ),
        );

      if (!hasRecipientBudget(counts)) return false;

      await tx.insert(emailSend).values({ recipientHash });
      return true;
    });

    // Outside the per-recipient lock so sends to different addresses never queue on stale rows; a failed prune only leaves rows counts skip.
    await db
      .delete(emailSend)
      .where(lt(emailSend.sentAt, dayAgo))
      .catch(() => {});

    return reserved;
  },

  async release(recipient) {
    const latest = db
      .select({ id: emailSend.id })
      .from(emailSend)
      .where(eq(emailSend.recipientHash, hashRecipient(recipient)))
      .orderBy(desc(emailSend.sentAt))
      .limit(1)
      // Two overlapping releases would otherwise pick the same row, and one slot stays spent.
      .for("update", { skipLocked: true });

    await db.delete(emailSend).where(eq(emailSend.id, sql`(${latest})`));
  },
};
