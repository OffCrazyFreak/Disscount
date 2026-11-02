import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Each select resolves to the next queued rows; where clauses are kept for inspection.
const fake = vi.hoisted(() => ({
  selectResults: [] as { value?: string; id?: string }[][],
  selectWheres: [] as unknown[],
  inserted: vi.fn(),
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
    execute: async () => {},
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

const { claimResetEmail, claimVerificationEmail } =
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
  it("skips while a live marker covers the same address", async () => {
    fake.selectResults.push([{ value: "person@example.com" }]);

    const release = await claimVerificationEmail(
      "user-1",
      "person@example.com",
      verificationToken({ email: "person@example.com", exp }),
    );

    expect(release).toBeNull();
  });

  it("sends to a different address and marks the token's expiry", async () => {
    fake.selectResults.push([{ value: "old@example.com" }]);

    const release = await claimVerificationEmail(
      "user-1",
      "person@example.com",
      verificationToken({ email: "person@example.com", exp }),
    );

    expect(release).toBeTypeOf("function");
    expect(fake.inserted).toHaveBeenCalledWith({
      identifier: "verification-email:user-1",
      value: "person@example.com",
      expiresAt: new Date(exp * 1000),
    });
  });

  it("always lets a change-email link through", async () => {
    const release = await claimVerificationEmail(
      "user-1",
      "new@example.com",
      verificationToken({
        email: "old@example.com",
        updateTo: "new@example.com",
        exp,
      }),
    );

    expect(release).toBeTypeOf("function");
    expect(fake.inserted).not.toHaveBeenCalled();
  });
});
