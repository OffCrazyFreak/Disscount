import { describe, expect, it } from "vitest";

import {
  scrubSensitiveData,
  scrubString,
} from "@/lib/sentry/scrub-sensitive-data";

describe("scrubString", () => {
  it("filters the reset token in a page URL and keeps the other params", () => {
    expect(scrubString("https://disscount.me/reset-password?token=abc")).toBe(
      "https://disscount.me/reset-password?token=[Filtered]",
    );
    expect(scrubString("/?modal=reset-password&token=abc&x=1")).toBe(
      "/?modal=reset-password&token=[Filtered]&x=1",
    );
  });

  it("filters the token in the better-auth reset link path", () => {
    expect(scrubString("/api/auth/reset-password/abc?callbackURL=%2F")).toBe(
      "/api/auth/reset-password/[Filtered]?callbackURL=%2F",
    );
  });

  it("filters OAuth and verification params, in any case", () => {
    expect(
      scrubString("/api/auth/callback/google?code=c1&state=s1&Token=t1"),
    ).toBe(
      "/api/auth/callback/google?code=[Filtered]&state=[Filtered]&Token=[Filtered]",
    );
    expect(scrubString("/verify-email#access_token=a&id_token=b")).toBe(
      "/verify-email#access_token=[Filtered]&id_token=[Filtered]",
    );
  });

  it("filters a bare query string and a URL inside a span description", () => {
    expect(scrubString("token=abc&callbackURL=%2F")).toBe(
      "token=[Filtered]&callbackURL=%2F",
    );
    expect(scrubString("GET /api/auth/verify-email?token=abc")).toBe(
      "GET /api/auth/verify-email?token=[Filtered]",
    );
  });

  it("leaves lookalike keys and plain text alone", () => {
    expect(scrubString("/products?barcode=123&tokens=2")).toBe(
      "/products?barcode=123&tokens=2",
    );
    expect(scrubString("not a url %E0%A4%A")).toBe("not a url %E0%A4%A");
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

describe("scrubSensitiveData on server request bodies", () => {
  it("filters the reset body the server SDK attaches as a JSON string", () => {
    const event = {
      request: {
        data: '{"newPassword":"hunter22","token":"abc","note":"a \\"q\\" b"}',
      },
    };

    expect(scrubSensitiveData(event).request.data).toBe(
      '{"newPassword":"[Filtered]","token":"[Filtered]","note":"a \\"q\\" b"}',
    );
  });
});

describe("scrubSensitiveData on the sign-in body", () => {
  it("filters the password a breached password timeout event carries", () => {
    const event = {
      request: { data: '{"email":"a@b.c","password":"hunter22"}' },
      extra: { password: "hunter22" },
    };

    expect(scrubSensitiveData(event)).toEqual({
      request: { data: '{"email":"a@b.c","password":"[Filtered]"}' },
      extra: { password: "[Filtered]" },
    });
  });
});

describe("scrubSensitiveData on Replay network events", () => {
  it("filters the URL in a recorded fetch", () => {
    const networkEvent = {
      type: 5,
      timestamp: 1,
      data: {
        tag: "performanceSpan",
        payload: { op: "resource.fetch", description: "/api/x?token=abc" },
      },
    };

    expect(scrubSensitiveData(networkEvent).data.payload.description).toBe(
      "/api/x?token=[Filtered]",
    );
  });
});
