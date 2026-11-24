import { describe, expect, it } from "vitest";

import { GET } from "@/app/[locale]/reset-password/route";

async function redirectFor(url: string, locale: string) {
  const response = await GET(new Request(url), {
    params: Promise.resolve({ locale }),
  });

  return {
    status: response.status,
    location: response.headers.get("Location"),
  };
}

describe("GET /reset-password", () => {
  it("answers the email link with a real redirect, so the modal page loads in full", async () => {
    expect(
      await redirectFor("http://localhost/reset-password?token=a b", "hr"),
    ).toEqual({
      status: 307,
      location: "/?modal=reset-password&token=a%20b",
    });
  });

  it("keeps the locale prefix", async () => {
    expect(
      await redirectFor("http://localhost/en/reset-password?token=abc", "en"),
    ).toEqual({ status: 307, location: "/en?modal=reset-password&token=abc" });
  });

  it("opens the modal without a token, and falls back to Croatian for an unknown locale", async () => {
    expect(
      await redirectFor("http://localhost/xx/reset-password", "xx"),
    ).toEqual({ status: 307, location: "/?modal=reset-password" });
  });
});
