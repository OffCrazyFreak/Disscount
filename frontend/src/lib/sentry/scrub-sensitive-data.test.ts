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

  it("stops a filtered value at the end of a quoted string", () => {
    expect(
      scrubString(
        '{"url":"/?token=abc","link":"/api/auth/reset-password/def","status":500}',
      ),
    ).toBe(
      '{"url":"/?token=[Filtered]","link":"/api/auth/reset-password/[Filtered]","status":500}',
    );
    expect(scrubString('"{\\"url\\":\\"/?token=abc\\"}"')).toBe(
      '"{\\"url\\":\\"/?token=[Filtered]\\"}"',
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

describe("scrubSensitiveData on form-encoded bodies and session headers", () => {
  it("filters passwords in a form-encoded body", () => {
    const event = {
      request: { data: "email=a%40b.c&password=hunter22&newPassword=x" },
    };

    expect(scrubSensitiveData(event).request.data).toBe(
      "email=a%40b.c&password=[Filtered]&newPassword=[Filtered]",
    );
  });

  it("filters cookies and the Authorization header, keeping other headers", () => {
    const event = {
      request: {
        cookies: { "better-auth.session_token": "abc" },
        headers: {
          Cookie: "better-auth.session_token=abc",
          authorization: "Bearer abc",
          "user-agent": "Firefox",
        },
      },
    };

    expect(scrubSensitiveData(event)).toEqual({
      request: {
        cookies: "[Filtered]",
        headers: {
          Cookie: "[Filtered]",
          authorization: "[Filtered]",
          "user-agent": "Firefox",
        },
      },
    });
  });
});

describe("scrubString on session cookies and bearer tokens in text", () => {
  it("filters every better-auth cookie value, with or without the secure prefix", () => {
    expect(
      scrubString(
        "Cookie: NEXT_LOCALE=en; __Secure-better-auth.session_token=abc.sig; better-auth.session_data=eyJ; better-auth.dont_remember=true",
      ),
    ).toBe(
      "Cookie: NEXT_LOCALE=en; __Secure-better-auth.session_token=[Filtered]; better-auth.session_data=[Filtered]; better-auth.dont_remember=[Filtered]",
    );
  });

  it("filters a quoted cookie value whole", () => {
    expect(scrubString('better-auth.session_token="abc.sig"; x=1')).toBe(
      "better-auth.session_token=[Filtered]; x=1",
    );
  });

  it("keeps the JSON around a cookie line intact", () => {
    expect(scrubString('{"h":"better-auth.session_token=abc","b":"x"}')).toBe(
      '{"h":"better-auth.session_token=[Filtered]","b":"x"}',
    );
  });

  it("leaves the word bearer in prose alone", () => {
    expect(scrubString("the bearer of this card")).toBe(
      "the bearer of this card",
    );
  });

  it("filters the token in a Set-Cookie line and keeps its attributes", () => {
    expect(
      scrubString(
        "set-cookie: __Host-better-auth.session_token=abc; Path=/; HttpOnly",
      ),
    ).toBe(
      "set-cookie: __Host-better-auth.session_token=[Filtered]; Path=/; HttpOnly",
    );
  });

  it("filters a bearer token wherever it appears", () => {
    expect(
      scrubString("request failed with Authorization: Bearer eyJh.eyJz.c2ln"),
    ).toBe("request failed with Authorization: Bearer [Filtered]");
    expect(scrubString('{"auth":"bearer abc-123_x~+/="}')).toBe(
      '{"auth":"bearer [Filtered]"}',
    );
  });

  it("filters cookies sent as header tuples", () => {
    const event = {
      request: {
        headers: [["x-session", "better-auth.session_token=abc"]],
      },
    };

    expect(scrubSensitiveData(event).request.headers).toEqual([
      ["x-session", "better-auth.session_token=[Filtered]"],
    ]);
  });
});

describe("scrubSensitiveData on the sign-in body", () => {
  it("filters the password a breached password timeout event carries", () => {
    const event = {
      request: { data: '{"email":"a@b.c","password":"hunter22"}' },
      extra: { password: "hunter22", currentPassword: "old" },
    };

    expect(scrubSensitiveData(event)).toEqual({
      request: { data: '{"email":"a@b.c","password":"[Filtered]"}' },
      extra: { password: "[Filtered]", currentPassword: "[Filtered]" },
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

describe("scrubSensitiveData on streamed spans", () => {
  it("filters secrets in a request body attribute and keeps the other attributes", () => {
    const span = {
      name: "POST /api/auth/reauth/verify-code",
      attributes: {
        "http.request.body.data": '{"code":"123456"}',
        "http.response.status_code": 200,
      },
    };

    expect(scrubSensitiveData(span).attributes).toEqual({
      "http.request.body.data": '{"code":"[Filtered]"}',
      "http.response.status_code": 200,
    });
  });
});

describe("scrubSensitiveData on a code that is not a secret", () => {
  it("keeps an error code inside a JSON string", () => {
    expect(scrubString('{"code":"INVALID_PASSWORD"}')).toBe(
      '{"code":"INVALID_PASSWORD"}',
    );
  });

  it("keeps an error code held as an object key", () => {
    expect(scrubSensitiveData({ code: "NOT_FOUND" })).toEqual({
      code: "NOT_FOUND",
    });
  });
});
