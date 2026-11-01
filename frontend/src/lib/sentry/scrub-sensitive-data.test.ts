import { describe, expect, it } from "vitest";

import {
  scrubRecordingEvent,
  scrubSensitiveData,
  scrubUrl,
} from "@/lib/sentry/scrub-sensitive-data";

describe("scrubUrl", () => {
  it("filters the reset token in a page URL and keeps the other params", () => {
    expect(scrubUrl("https://disscount.me/reset-password?token=abc")).toBe(
      "https://disscount.me/reset-password?token=[Filtered]",
    );
    expect(scrubUrl("/?modal=reset-password&token=abc&x=1")).toBe(
      "/?modal=reset-password&token=[Filtered]&x=1",
    );
  });

  it("filters the token in the better-auth reset link path", () => {
    expect(scrubUrl("/api/auth/reset-password/abc?callbackURL=%2F")).toBe(
      "/api/auth/reset-password/[Filtered]?callbackURL=%2F",
    );
  });

  it("filters OAuth and verification params, in any case", () => {
    expect(
      scrubUrl("/api/auth/callback/google?code=c1&state=s1&Token=t1"),
    ).toBe(
      "/api/auth/callback/google?code=[Filtered]&state=[Filtered]&Token=[Filtered]",
    );
    expect(scrubUrl("/verify-email#access_token=a&id_token=b")).toBe(
      "/verify-email#access_token=[Filtered]&id_token=[Filtered]",
    );
  });

  it("filters a bare query string and a URL inside a span description", () => {
    expect(scrubUrl("token=abc&callbackURL=%2F")).toBe(
      "token=[Filtered]&callbackURL=%2F",
    );
    expect(scrubUrl("GET /api/auth/verify-email?token=abc")).toBe(
      "GET /api/auth/verify-email?token=[Filtered]",
    );
  });

  it("leaves lookalike keys and plain text alone", () => {
    expect(scrubUrl("/products?barcode=123&tokens=2")).toBe(
      "/products?barcode=123&tokens=2",
    );
    expect(scrubUrl("not a url %E0%A4%A")).toBe("not a url %E0%A4%A");
  });
});

describe("scrubSensitiveData", () => {
  it("scrubs URLs and sensitive fields anywhere in an event", () => {
    const event = {
      transaction: "/reset-password?token=abc",
      request: {
        url: "https://disscount.me/?modal=reset-password&token=abc",
        query_string: "modal=reset-password&token=abc",
        data: { token: "abc", newPassword: "hunter22", email: "a@b.c" },
      },
      breadcrumbs: [
        { category: "navigation", data: { from: "/", to: "/?token=abc" } },
      ],
      spans: [{ data: { "url.full": "https://x/?token=abc" } }],
    };

    expect(scrubSensitiveData(event)).toEqual({
      transaction: "/reset-password?token=[Filtered]",
      request: {
        url: "https://disscount.me/?modal=reset-password&token=[Filtered]",
        query_string: "modal=reset-password&token=[Filtered]",
        data: {
          token: "[Filtered]",
          newPassword: "[Filtered]",
          email: "a@b.c",
        },
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: { from: "/", to: "/?token=[Filtered]" },
        },
      ],
      spans: [{ data: { "url.full": "https://x/?token=[Filtered]" } }],
    });
  });

  it("does not mutate the input and keeps non-plain values", () => {
    const error = new Error("boom");
    const input = { url: "/?token=abc", count: 2, error };

    const output = scrubSensitiveData(input);

    expect(input.url).toBe("/?token=abc");
    expect(output.count).toBe(2);
    expect(output.error).toBe(error);
  });

  it("survives a circular reference in console breadcrumb arguments", () => {
    const argument: Record<string, unknown> = { url: "/?token=abc" };
    argument.self = argument;

    const output = scrubSensitiveData({ data: { arguments: [argument] } });

    const [copy] = output.data.arguments;
    expect(copy.url).toBe("/?token=[Filtered]");
    expect(copy.self).toBe(copy);
  });
});

describe("scrubRecordingEvent", () => {
  it("scrubs URLs in replay network and navigation events", () => {
    const networkEvent = {
      type: 5,
      timestamp: 1,
      data: {
        tag: "performanceSpan",
        payload: { op: "resource.fetch", description: "/api/x?token=abc" },
      },
    };

    expect(scrubRecordingEvent(networkEvent).data.payload.description).toBe(
      "/api/x?token=[Filtered]",
    );
    expect(
      scrubRecordingEvent({
        type: 4,
        timestamp: 1,
        data: { href: "https://x/?token=abc" },
      }).data.href,
    ).toBe("https://x/?token=[Filtered]");
  });

  it("passes DOM snapshots through untouched", () => {
    const snapshot = { type: 2, timestamp: 1, data: { node: { id: 1 } } };

    expect(scrubRecordingEvent(snapshot)).toBe(snapshot);
  });
});
