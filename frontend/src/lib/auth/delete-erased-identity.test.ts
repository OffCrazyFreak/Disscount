import { drizzle } from "drizzle-orm/node-postgres";
import type { SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const captured = vi.hoisted(() => ({
  query: null as null | { sql: string; params: unknown[] },
}));

vi.mock("@/db", () => {
  const builder = drizzle.mock();

  return {
    db: {
      delete: (table: PgTable) => ({
        where: async (condition: SQL) => {
          captured.query = builder.delete(table).where(condition).toSQL();
        },
      }),
    },
  };
});

const { deleteErasedIdentity } =
  await import("@/lib/auth/delete-erased-identity");

const USER_ID = "7f1c2d3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f";

describe("deleteErasedIdentity", () => {
  it("deletes only this login, and only when its erasure tombstone exists", async () => {
    await deleteErasedIdentity(USER_ID);

    expect(captured.query?.sql).toBe(
      'delete from "user" where ("user"."id" = $1 and exists (select 1 from erasure_ledger where erasure_ledger.user_id = "user"."id"))',
    );
    expect(captured.query?.params).toEqual([USER_ID]);
  });
});
