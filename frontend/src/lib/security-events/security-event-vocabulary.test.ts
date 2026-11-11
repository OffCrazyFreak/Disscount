import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SECURITY_EVENT_TYPES } from "@/lib/security-events/security-event-vocabulary";

const MIGRATIONS = path.resolve(__dirname, "../../../drizzle");

// The newest migration that sets the check, so a new event type without a migration fails here, not in production.
function migratedEventTypes() {
  const latest = readdirSync(MIGRATIONS)
    .filter((file) => /^\d{4}_.*\.sql$/.test(file))
    .sort()
    .map((file) => readFileSync(path.join(MIGRATIONS, file), "utf8"))
    .filter((sql) => sql.includes("security_event_event_type_check"))
    .at(-1);

  const list = latest?.match(
    /security_event_event_type_check" CHECK \(event_type IN \(([^)]*)\)\)/,
  )?.[1];

  return list?.split(",").map((value) => value.trim().replace(/'/g, ""));
}

describe("security event vocabulary", () => {
  it("matches the event types the database check allows", () => {
    expect(migratedEventTypes()).toEqual(SECURITY_EVENT_TYPES);
  });
});
