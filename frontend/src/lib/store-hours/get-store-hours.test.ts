import { getTableName, type Table } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  succeeded: false,
  rows: [] as unknown[],
  order: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/store-hours/sync/run-hours-sync", () => ({
  TEMPLATE_LEASE: { id: "store-hours-template", every: "7 days" },
  dueHoursJob: async () => null,
  runHoursJob: async () => {},
}));
vi.mock("@/lib/store-locations/sync/sync-lease", () => ({
  hasSyncSucceeded: async () => {
    state.order.push("lease");
    return state.succeeded;
  },
}));
vi.mock("@/lib/store-hours/build-store-hours", () => ({
  hoursWindow: () => ({ from: "2026-11-05", to: "2026-11-19" }),
  buildStoreHours: () => ({}),
}));
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      // resetModules gives each load its own table objects, so match by name.
      from: async (table: Table) => {
        state.order.push("rows");
        return getTableName(table) === "store_hours" ? state.rows : [];
      },
    }),
  },
}));

async function load() {
  vi.resetModules();
  const { getStoreHours } = await import("@/lib/store-hours/get-store-hours");
  return getStoreHours();
}

describe("getStoreHours", () => {
  beforeEach(() => {
    state.succeeded = false;
    state.rows = [];
    state.order = [];
  });

  it("is incomplete before any template run has succeeded", async () => {
    state.rows = [{}];

    expect((await load()).complete).toBe(false);
  });

  it("is incomplete when a run succeeded but wrote no rows", async () => {
    state.succeeded = true;

    expect((await load()).complete).toBe(false);
  });

  it("is complete once a run succeeded and rows exist", async () => {
    state.succeeded = true;
    state.rows = [{}];

    expect((await load()).complete).toBe(true);
  });

  it("reads the run's result before the rows", async () => {
    await load();

    expect(state.order[0]).toBe("lease");
  });
});
