import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { webPgSchema } from "@/db/pg-schemas";
import {
  OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/lib/security-events/security-event-vocabulary";

function sqlList(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(", "));
}

// Append only for the runtime logins; web.purge_security_events() applies the retention (docs/AUTH.md, 8.6).
export const securityEvent = webPgSchema.table(
  "security_event",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    occurredAt: timestamp("occurred_at")
      .default(sql`(now() AT TIME ZONE 'UTC')`)
      .notNull(),
    eventType: varchar("event_type", { length: 48 }).notNull(),
    outcome: varchar("outcome", { length: 16 }).notNull(),
    // No foreign key: the row outlives the account, as the record of what happened to it.
    userId: uuid("user_id"),
    // A keyed hash of the email typed into a failed sign-in, never the email itself.
    subjectHash: text("subject_hash"),
    ipAddress: text("ip_address"),
    userAgent: varchar("user_agent", { length: 256 }),
    country: varchar("country", { length: 2 }),
    payload: jsonb("payload")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
  },
  (table) => [
    index("security_event_user_occurred_idx").on(
      table.userId,
      table.occurredAt,
    ),
    index("security_event_occurred_idx").on(table.occurredAt),
    index("security_event_subject_occurred_idx")
      .on(table.subjectHash, table.occurredAt)
      .where(sql`subject_hash IS NOT NULL`),
    check(
      "security_event_event_type_check",
      sql`event_type IN (${sqlList(SECURITY_EVENT_TYPES)})`,
    ),
    check(
      "security_event_outcome_check",
      sql`outcome IN (${sqlList(OUTCOMES)})`,
    ),
    check(
      "security_event_payload_size_check",
      sql`pg_column_size(payload) < 2048`,
    ),
  ],
);
