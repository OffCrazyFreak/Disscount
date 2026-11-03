import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { validateEnv } = await import("@/lib/env-parse");
const { serverEnv, serverEnvSchema, validateServerEnv } =
  await import("@/lib/server-env");

const exampleEnv = parse(
  readFileSync(new URL("../../.env.local.example", import.meta.url)),
);

describe("serverEnvSchema", () => {
  it("accepts the example env file", () => {
    expect(() => validateEnv(serverEnvSchema, exampleEnv)).not.toThrow();
  });

  it("rejects the example env without a required variable", () => {
    const { RESEND_API_KEY: _, ...withoutResend } = exampleEnv;
    expect(() => validateEnv(serverEnvSchema, withoutResend)).toThrow(
      /RESEND_API_KEY/,
    );
  });
});

describe("validateServerEnv", () => {
  it("names every missing variable in one error", () => {
    for (const [key, value] of Object.entries(exampleEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("EMAIL_FROM", undefined);

    expect(() => validateServerEnv()).toThrow(
      /BETTER_AUTH_SECRET[\s\S]*EMAIL_FROM/,
    );
  });
});

describe("serverEnv", () => {
  it("reads the current value and applies defaults", () => {
    vi.stubEnv("GIT_SHA", "abc123");
    vi.stubEnv("CIJENE_API_URL", "");

    expect(serverEnv.GIT_SHA).toBe("abc123");
    expect(serverEnv.CIJENE_API_URL).toBe("https://api.cijene.dev");
  });

  it("throws with the variable name when a required one is missing", () => {
    vi.stubEnv("BETTER_AUTH_URL", undefined);

    expect(() => serverEnv.BETTER_AUTH_URL).toThrow(
      "Invalid environment variable BETTER_AUTH_URL: is required",
    );
  });

  it("rejects a URL variable that is not http or https", () => {
    vi.stubEnv("BETTER_AUTH_URL", "localhost:3000");

    expect(() => serverEnv.BETTER_AUTH_URL).toThrow(/BETTER_AUTH_URL/);
  });
});
