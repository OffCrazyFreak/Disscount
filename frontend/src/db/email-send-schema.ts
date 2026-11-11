import { sql } from "drizzle-orm";
import { index, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { webPgSchema } from "@/db/pg-schemas";

// Kept for a day to cap sends per recipient; the address is stored as a SHA-256 hash, never in clear.
export const emailSend = webPgSchema.table(
  "email_send",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    recipientHash: text("recipient_hash").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => [
    index("email_send_recipient_sent_idx").on(
      table.recipientHash,
      table.sentAt,
    ),
    index("email_send_sent_idx").on(table.sentAt),
  ],
);
