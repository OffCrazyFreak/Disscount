import "server-only";

import { createHash } from "node:crypto";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailSend } from "@/db/email-send-schema";
import {
  hasRecipientBudget,
  IRecipientSendGate,
} from "@/lib/email/recipient-send-cap";

function hashRecipient(recipient: string) {
  return createHash("sha256")
    .update(recipient.trim().toLowerCase())
    .digest("hex");
}

// Postgres-backed so the cap holds across deploys and every route bundle.
export const recipientSendLog: IRecipientSendGate = {
  async tryReserve(recipient) {
    const recipientHash = hashRecipient(recipient);
    const dayAgo = sql`now() - interval '1 day'`;

    return db.transaction(async (tx) => {
      // Serialises concurrent sends to one address, so two requests cannot both
      // read the last free slot.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${recipientHash}))`,
      );

      await tx.delete(emailSend).where(lt(emailSend.sentAt, dayAgo));

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
  },
};
