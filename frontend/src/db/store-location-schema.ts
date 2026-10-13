import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Coordinates for cijene-api stores that upstream does not locate, or locates
 * wrongly. Keyed by the upstream identity so a store keeps its row across syncs.
 * A row with null coordinates records a failed attempt, so the slow geocoders
 * are not retried on every run.
 */
export const storeLocation = pgTable(
  "store_location",
  {
    chainCode: text("chain_code").notNull(),
    storeCode: text("store_code").notNull(),
    lat: doublePrecision("lat"),
    lon: doublePrecision("lon"),
    source: text("source"),
    precision: text("precision"),
    attempts: integer("attempts").default(0).notNull(),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.chainCode, table.storeCode] })],
);

/** One row per sync job, so a run can tell how stale the data is. */
export const storeLocationSync = pgTable("store_location_sync", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  lastError: text("last_error"),
});
