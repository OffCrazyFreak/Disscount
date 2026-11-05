import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Upstream identity keeps a store's row across syncs; null coordinates stop slow geocoder retries. */
export const storeLocation = pgTable(
  "store_location",
  {
    chainCode: text("chain_code").notNull(),
    storeCode: text("store_code").notNull(),
    lat: doublePrecision("lat"),
    lon: doublePrecision("lon"),
    source: text("source"),
    precision: text("precision"),
    // Once upstream changes this, the pin belongs to the old building and is looked up again.
    address: text("address"),
    attempts: integer("attempts").default(0).notNull(),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    // Apart from lastAttemptAt, so a Geoapify miss cannot hold a store back from Nominatim.
    geoapifyMissedAt: timestamp("geoapify_missed_at", { withTimezone: true }),
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
