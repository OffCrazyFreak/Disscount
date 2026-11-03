import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { describe, expect, it, vi } from "vitest";

import { appUrl, clientEnv, clientEnvSchema } from "@/lib/env";
import { validateEnv } from "@/lib/env-parse";

const exampleEnv = parse(
  readFileSync(new URL("../../.env.local.example", import.meta.url)),
);

describe("clientEnvSchema", () => {
  it("accepts the example env file", () => {
    expect(() => validateEnv(clientEnvSchema, exampleEnv)).not.toThrow();
  });

  it("rejects a malformed URL", () => {
    const malformed = { ...exampleEnv, NEXT_PUBLIC_API_URL: "localhost:8080" };

    expect(() => validateEnv(clientEnvSchema, malformed)).toThrow(
      /NEXT_PUBLIC_API_URL/,
    );
  });
});

describe("clientEnv", () => {
  it("treats an empty build arg as unset", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "");

    expect(clientEnv.NEXT_PUBLIC_API_URL).toBe("http://localhost:8080");
    expect(clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID).toBeUndefined();
  });

  it("turns opt-in flags into booleans", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_REACT_SCAN", "true");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS", "false");

    expect(clientEnv.NEXT_PUBLIC_ENABLE_REACT_SCAN).toBe(true);
    expect(clientEnv.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS).toBe(false);
  });
});

describe("appUrl", () => {
  it("returns the configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://disscount.me/some/path");

    expect(appUrl()).toBe("https://disscount.me");
  });

  it("fails closed in production when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    vi.stubEnv("NODE_ENV", "production");

    expect(() => appUrl()).toThrow(/NEXT_PUBLIC_APP_URL/);
  });
});

describe("clientEnv proxy", () => {
  it("returns undefined for keys outside the schema", () => {
    expect(Reflect.get(clientEnv, "constructor")).toBeUndefined();
    expect(Reflect.get(clientEnv, "NOT_A_VARIABLE")).toBeUndefined();
  });
});
