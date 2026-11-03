import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Each select resolves to the next queued rows; where clauses are kept for inspection.
const fake = vi.hoisted(() => ({
  selectResults: [] as { value?: string; id?: string }[][],
  selectWheres: [] as unknown[],
  inserted: vi.fn(),
  executed: vi.fn(),
  deleted: vi.fn(),
}));

vi.mock("@/db", () => {
  const select = () => ({
    from: () => ({
      where: (condition: unknown) => {
        fake.selectWheres.push(condition);
        return { limit: async () => fake.selectResults.shift() ?? [] };
      },
    }),
  });
  const client = {
    execute: async (query: unknown) => fake.executed(query),
    select,
    delete: () => ({
      where: async (condition: unknown) => fake.deleted(condition),
    }),
    insert: () => ({
      values: (row: unknown) => {
        fake.inserted(row);
        return { returning: async () => [{ id: "marker-1" }] };
      },
    }),
  };
  return {
    db: {
      ...client,
      transaction: (run: (tx: typeof client) => unknown) => run(client),
    },
  };
});

const { claimResetEmail, claimSignUpNotice, claimVerificationEmail } =
  await import("@/lib/auth/email-link-marker");

function render(condition: unknown) {
  return new PgDialect().sqlToQuery(condition as SQL);
}

function verificationToken(claims: object) {
  return `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
}

const exp = Math.floor(Date.now() / 1000) + 3600;

describe("claimResetEmail", () => {
  it("looks up only the user's unexpired marker", async () => {
    fake.selectWheres.length = 0;
    await claimResetEmail("user-1", "token-2");

    const lookup = render(fake.selectWheres[0]);
    expect(lookup.sql).toBe(
      '("verification"."identifier" = $1 and "verification"."expires_at" > $2)',
    );
    expect(lookup.params[0]).toBe("reset-email:user-1");

    const lock = render(fake.executed.mock.calls[0][0]);
    expect(lock.sql).toContain("pg_advisory_xact_lock");
    expect(lock.params).toEqual(["reset-email:user-1"]);
  });

  it("skips while the marked link's reset row is still live", async () => {
    fake.selectResults.push([{ value: "token-1" }], [{ id: "row-1" }]);

    expect(await claimResetEmail("user-1", "token-2")).toBeNull();
    expect(fake.inserted).not.toHaveBeenCalled();
  });

  it("sends again once the marked link was used", async () => {
    fake.selectResults.push([{ value: "token-1" }], []);

    const release = await claimResetEmail("user-1", "token-2");

    expect(release).toBeTypeOf("function");
    expect(fake.inserted).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "reset-email:user-1",
        value: "token-2",
      }),
    );
    const usedRowLookup = render(fake.selectWheres.at(-1));
    expect(usedRowLookup.sql).toBe(
      '("verification"."identifier" = $1 and "verification"."expires_at" > $2)',
    );
    expect(usedRowLookup.params[0]).toBe("reset-password:token-1");
  });

  it("release deletes the marker it wrote", async () => {
    const release = await claimResetEmail("user-1", "token-2");
    await release?.();

    expect(render(fake.deleted.mock.calls.at(-1)?.[0]).params).toEqual([
      "marker-1",
    ]);
  });
});

describe("claimVerificationEmail", () => {
  const signUpToken = verificationToken({ email: "person@example.com", exp });
  const changeToken = verificationToken({
    email: "old@example.com",
    updateTo: "new+deals@example.com",
    exp,
  });

  it("skips while a live marker covers the same address", async () => {
    fake.selectWheres.length = 0;
    fake.selectResults.push([{ value: "person@example.com" }]);

    expect(await claimVerificationEmail("user-1", signUpToken)).toBeNull();

    const lookup = render(fake.selectWheres[0]);
    expect(lookup.sql).toBe(
      '("verification"."identifier" = $1 and "verification"."expires_at" > $2)',
    );
    expect(lookup.params[0]).toBe("verification-email:user-1");
  });

  it("sends to a different address and marks the token's expiry", async () => {
    fake.selectResults.push([{ value: "old@example.com" }]);

    expect(await claimVerificationEmail("user-1", signUpToken)).toBeTypeOf(
      "function",
    );
    expect(fake.inserted).toHaveBeenCalledWith({
      identifier: "verification-email:user-1",
      value: "person@example.com",
      expiresAt: new Date(exp * 1000),
    });
  });

  it("skips a reloaded change-email confirmation while its link is live", async () => {
    fake.selectWheres.length = 0;
    fake.selectResults.push([{ value: "old@example.com" }]);

    expect(await claimVerificationEmail("user-1", changeToken)).toBeNull();
    // Plus tags reach one inbox, so alternating between two such links shares one marker.
    expect(render(fake.selectWheres[0]).params[0]).toBe(
      "change-email:user-1:new@example.com",
    );
  });

  it("sends a change-email link once the current address has changed", async () => {
    fake.selectResults.push([{ value: "older@example.com" }]);

    expect(await claimVerificationEmail("user-1", changeToken)).toBeTypeOf(
      "function",
    );
    expect(fake.inserted).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "change-email:user-1:new@example.com",
        value: "old@example.com",
      }),
    );
    // The stale marker goes first, so a later lookup never meets two rows.
    expect(render(fake.deleted.mock.calls[0][0]).params).toEqual([
      "change-email:user-1:new@example.com",
    ]);
  });
});

describe("claimSignUpNotice", () => {
  it("skips while any notice from the last hour is unexpired", async () => {
    fake.selectWheres.length = 0;
    fake.selectResults.push([{ value: "notice-1" }]);

    expect(await claimSignUpNotice("user-1", "notice-2")).toBeNull();
    expect(render(fake.selectWheres[0]).params[0]).toBe(
      "sign-up-notice:user-1",
    );
  });

  it("claims an hour once the last notice expired", async () => {
    fake.inserted.mockClear();
    const before = Date.now();

    expect(await claimSignUpNotice("user-1", "notice-2")).toBeTypeOf(
      "function",
    );
    const [row] = fake.inserted.mock.calls[0];
    expect(row).toMatchObject({
      identifier: "sign-up-notice:user-1",
      value: "notice-2",
    });
    expect(row.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 60 * 60 * 1000,
    );
  });
});
