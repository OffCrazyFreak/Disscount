import {
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { SundayRule, TimeRangeDto } from "@/lib/api/schemas";

/** Keyed like `store_location`; refreshed weekly from the chain finder or OpenStreetMap. */
export const storeHours = pgTable(
  "store_hours",
  {
    chainCode: text("chain_code").notNull(),
    storeCode: text("store_code").notNull(),
    // Monday first; a null day is one the source did not describe.
    weekly: jsonb("weekly").$type<(TimeRangeDto[] | null)[]>().notNull(),
    exceptions: jsonb("exceptions")
      .$type<{ date: string; ranges: TimeRangeDto[] }[]>()
      .default([])
      .notNull(),
    sundays: text("sundays").$type<SundayRule>().default("dated").notNull(),
    // "chain" or "osm".
    source: text("source").notNull(),
    // The store's own page, which the link checker visits weekly.
    checkUrl: text("check_url"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    // "ok", "broken" (404 or 410) or "unverified" (blocked, rate limited, down).
    linkStatus: text("link_status"),
    linkCheckedAt: timestamp("link_checked_at", { withTimezone: true }),
    linkFailures: integer("link_failures").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.chainCode, table.storeCode] })],
);

/** Sunday and holiday hours a chain announces only days ahead; an empty store code covers the whole chain. */
export const storeHoursOverlay = pgTable(
  "store_hours_overlay",
  {
    chainCode: text("chain_code").notNull(),
    storeCode: text("store_code").default("").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ranges: jsonb("ranges").$type<TimeRangeDto[]>().notNull(),
    source: text("source").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chainCode, table.storeCode, table.date] }),
  ],
);

/** A run whose store count drops sharply is rejected, so a redesigned page cannot wipe a chain. */
export const storeHoursRun = pgTable(
  "store_hours_run",
  {
    job: text("job").notNull(),
    chainCode: text("chain_code").notNull(),
    acceptedCount: integer("accepted_count"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    lastCount: integer("last_count"),
    // "accepted", "rejected", "failed" or "disabled".
    lastStatus: text("last_status").notNull(),
    lastError: text("last_error"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.job, table.chainCode] })],
);
