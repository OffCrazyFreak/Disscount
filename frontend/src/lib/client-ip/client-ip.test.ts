import { describe, expect, it } from "vitest";

import {
  CLIENT_IP_HEADER,
  resolveClientIp,
  withTrustedClientIp,
} from "@/lib/client-ip/client-ip";

const CLOUDFLARE_EDGE = "172.70.1.2";
const CLOUDFLARE_EDGE_V6 = "2606:4700:10::1";
const VISITOR = "93.140.10.20";
const DIRECT_CALLER = "198.51.100.7";

function headersOf(entries: Record<string, string>) {
  return new Headers(entries);
}

describe("resolveClientIp", () => {
  it("takes cf-connecting-ip when Traefik's peer is a Cloudflare edge", () => {
    const headers = headersOf({
      "x-forwarded-for": `${VISITOR}, ${CLOUDFLARE_EDGE}`,
      "cf-connecting-ip": VISITOR,
    });

    expect(resolveClientIp(headers)).toBe(VISITOR);
  });

  it("accepts an IPv6 Cloudflare edge as the peer", () => {
    const headers = headersOf({
      "x-forwarded-for": CLOUDFLARE_EDGE_V6,
      "cf-connecting-ip": VISITOR,
    });

    expect(resolveClientIp(headers)).toBe(VISITOR);
  });

  it("ignores a forged cf-connecting-ip from a caller that bypassed Cloudflare", () => {
    const headers = headersOf({
      "x-forwarded-for": DIRECT_CALLER,
      "cf-connecting-ip": "203.0.113.99",
    });

    expect(resolveClientIp(headers)).toBe(DIRECT_CALLER);
  });

  it("ignores a spoofed Cloudflare address placed left of the real peer", () => {
    const headers = headersOf({
      "x-forwarded-for": `${CLOUDFLARE_EDGE}, ${DIRECT_CALLER}`,
      "cf-connecting-ip": "203.0.113.99",
    });

    expect(resolveClientIp(headers)).toBe(DIRECT_CALLER);
  });

  it("falls back to the Cloudflare peer when cf-connecting-ip is not an address", () => {
    const headers = headersOf({
      "x-forwarded-for": CLOUDFLARE_EDGE,
      "cf-connecting-ip": "not-an-ip",
    });

    expect(resolveClientIp(headers)).toBe(CLOUDFLARE_EDGE);
  });

  it("returns null with no usable forwarded hop", () => {
    expect(resolveClientIp(headersOf({}))).toBeNull();
    expect(
      resolveClientIp(headersOf({ "x-forwarded-for": "garbage" })),
    ).toBeNull();
  });
});

describe("withTrustedClientIp", () => {
  it("overwrites the client IP header with the resolved address", () => {
    const request = new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "x-forwarded-for": DIRECT_CALLER,
        [CLIENT_IP_HEADER]: "203.0.113.99",
      },
      body: "{}",
    });

    const trusted = withTrustedClientIp(request);

    expect(trusted.headers.get(CLIENT_IP_HEADER)).toBe(DIRECT_CALLER);
  });

  it("drops the header when no address resolves, so a forged one never survives", () => {
    const request = new Request("http://localhost/api/auth/get-session", {
      headers: { [CLIENT_IP_HEADER]: "203.0.113.99" },
    });

    expect(withTrustedClientIp(request).headers.has(CLIENT_IP_HEADER)).toBe(
      false,
    );
  });

  it("keeps the request body readable", async () => {
    const request = new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "x-forwarded-for": DIRECT_CALLER },
      body: '{"email":"a@b.hr"}',
    });

    await expect(withTrustedClientIp(request).text()).resolves.toBe(
      '{"email":"a@b.hr"}',
    );
  });
});
