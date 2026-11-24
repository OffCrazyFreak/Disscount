import { describe, expect, it } from "vitest";

import {
  CLIENT_COUNTRY_HEADER,
  CLIENT_IP_HEADER,
  resolveClientIp,
  trustedCountry,
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

// Mirrors proxyNextRequest in Next's app route module; only Node 24's undici throws on new Request(proxy).
function nextProxy(request: Request): Request {
  return new Proxy(request, {
    get(target, prop) {
      const value: unknown = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

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

  it("accepts the Proxy Next wraps around a route handler's request", async () => {
    const request = new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "x-forwarded-for": DIRECT_CALLER },
      body: '{"email":"a@b.hr"}',
    });
    const trusted = withTrustedClientIp(nextProxy(request));

    expect(trusted.method).toBe("POST");
    expect(trusted.headers.get(CLIENT_IP_HEADER)).toBe(DIRECT_CALLER);
    // better-auth clones sign-in and sign-up requests before reading them.
    await expect(trusted.clone().text()).resolves.toBe('{"email":"a@b.hr"}');
    await expect(trusted.text()).resolves.toBe('{"email":"a@b.hr"}');
  });

  it("copies a bodyless GET through the Proxy", () => {
    const request = new Request("http://localhost/api/auth/get-session", {
      headers: { "x-forwarded-for": DIRECT_CALLER },
    });

    const trusted = withTrustedClientIp(nextProxy(request));

    expect(trusted.method).toBe("GET");
    expect(trusted.body).toBeNull();
  });

  it("keeps Cloudflare's country header from a Cloudflare edge", () => {
    const request = withTrustedClientIp(
      new Request("http://localhost/api/auth/sign-in/email", {
        headers: {
          "x-forwarded-for": `${VISITOR}, ${CLOUDFLARE_EDGE}`,
          [CLIENT_COUNTRY_HEADER]: "HR",
        },
      }),
    );

    expect(request.headers.get(CLIENT_COUNTRY_HEADER)).toBe("HR");
  });

  it("drops a country header from a caller that bypassed Cloudflare", () => {
    const request = withTrustedClientIp(
      new Request("http://localhost/api/auth/sign-in/email", {
        headers: {
          "x-forwarded-for": DIRECT_CALLER,
          [CLIENT_COUNTRY_HEADER]: "US",
        },
      }),
    );

    expect(request.headers.get(CLIENT_COUNTRY_HEADER)).toBeNull();
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

  it("keeps the abort signal, so a dropped connection still cancels", () => {
    const controller = new AbortController();
    const request = new Request("http://localhost/api/auth/get-session", {
      signal: controller.signal,
    });

    const trusted = withTrustedClientIp(nextProxy(request));
    controller.abort();

    expect(trusted.signal.aborted).toBe(true);
  });
});

describe("trustedCountry", () => {
  it("reads a two-letter country code", () => {
    expect(trustedCountry(headersOf({ [CLIENT_COUNTRY_HEADER]: "hr" }))).toBe(
      "HR",
    );
  });

  it("drops Cloudflare's unknown and Tor markers", () => {
    for (const code of ["XX", "T1", "", "HRV"]) {
      expect(
        trustedCountry(headersOf({ [CLIENT_COUNTRY_HEADER]: code })),
      ).toBeNull();
    }
  });
});
