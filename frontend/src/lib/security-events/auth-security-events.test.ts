import type { GenericEndpointContext } from "better-auth";
import { APIError } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { recordSecurityEvent } = vi.hoisted(() => ({
  recordSecurityEvent: vi.fn(),
}));

vi.mock("@/lib/security-events/record-security-event", () => ({
  recordSecurityEvent,
}));

const {
  recordEndpointOutcome,
  recordIdentityLinked,
  recordIdentityUnlinked,
  recordSignIn,
  recordSignOut,
} = await import("@/lib/security-events/auth-security-events");

const headers = new Headers({ "user-agent": "Firefox" });

interface IHookContext {
  path: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  returned?: unknown;
  userId?: string;
}

function hookContext({ path, body, params, returned, userId }: IHookContext) {
  return {
    path,
    body,
    params,
    headers,
    context: {
      returned,
      session: userId ? { user: { id: userId } } : null,
    },
  } as unknown as GenericEndpointContext & { context: { returned?: unknown } };
}

function signInRefusal(code: string) {
  return new APIError("UNAUTHORIZED", { code, message: code });
}

describe("recordEndpointOutcome", () => {
  it("records a wrong password with the typed email for hashing", async () => {
    await recordEndpointOutcome(
      hookContext({
        path: "/sign-in/email",
        body: { email: "ana@example.com", password: "secret" },
        returned: signInRefusal("INVALID_EMAIL_OR_PASSWORD"),
      }),
    );

    expect(recordSecurityEvent).toHaveBeenCalledWith("authn_login_fail", {
      headers,
      typedEmail: "ana@example.com",
      payload: { reason: "bad_credentials" },
    });
  });

  it("names an unverified address and files any other refusal as other", async () => {
    await recordEndpointOutcome(
      hookContext({
        path: "/sign-in/email",
        body: { email: "ana@example.com" },
        returned: signInRefusal("EMAIL_NOT_VERIFIED"),
      }),
    );
    await recordEndpointOutcome(
      hookContext({
        path: "/sign-in/email",
        body: {},
        returned: signInRefusal("INVALID_EMAIL"),
      }),
    );

    expect(recordSecurityEvent.mock.calls.map(([, input]) => input)).toEqual([
      expect.objectContaining({ payload: { reason: "unverified" } }),
      expect.objectContaining({
        typedEmail: undefined,
        payload: { reason: "other" },
      }),
    ]);
  });

  it("leaves the breached-password refusal and a successful sign-in to the session hooks", async () => {
    await recordEndpointOutcome(
      hookContext({
        path: "/sign-in/email",
        returned: signInRefusal("PASSWORD_BREACHED"),
      }),
    );
    await recordEndpointOutcome(
      hookContext({ path: "/sign-in/email", returned: { token: "t" } }),
    );

    expect(recordSecurityEvent).not.toHaveBeenCalled();
  });

  it("records a reauth proof whether it passed or failed", async () => {
    await recordEndpointOutcome(
      hookContext({
        path: "/reauth/verify-code",
        userId: "user-1",
        returned: {},
      }),
    );
    await recordEndpointOutcome(
      hookContext({
        path: "/reauth/verify-password",
        userId: "user-1",
        returned: new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD" }),
      }),
    );

    expect(recordSecurityEvent.mock.calls).toEqual([
      [
        "authn_reauth_success",
        { userId: "user-1", headers, payload: { method: "code" } },
      ],
      [
        "authn_reauth_fail",
        { userId: "user-1", headers, payload: { method: "password" } },
      ],
    ]);
  });

  it("records account changes only when they succeed", async () => {
    await recordEndpointOutcome(
      hookContext({ path: "/change-password", userId: "user-1", returned: {} }),
    );
    await recordEndpointOutcome(
      hookContext({ path: "/change-email", userId: "user-1", returned: {} }),
    );
    await recordEndpointOutcome(
      hookContext({
        path: "/change-password",
        userId: "user-1",
        returned: new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD" }),
      }),
    );

    expect(recordSecurityEvent.mock.calls.map(([event]) => event)).toEqual([
      "authn_password_change",
      "user_email_change_requested",
    ]);
  });

  it("names which sessions a revocation ended", async () => {
    for (const path of [
      "/revoke-session",
      "/revoke-sessions",
      "/revoke-other-sessions",
    ]) {
      await recordEndpointOutcome(
        hookContext({ path, userId: "user-1", returned: {} }),
      );
    }

    expect(
      recordSecurityEvent.mock.calls.map(([, input]) => input.payload),
    ).toEqual([{ scope: "one" }, { scope: "all" }, { scope: "others" }]);
  });

  it("records no reauth failure for a request without a session", async () => {
    await recordEndpointOutcome(
      hookContext({
        path: "/reauth/verify-password",
        returned: new APIError("UNAUTHORIZED"),
      }),
    );

    expect(recordSecurityEvent).not.toHaveBeenCalled();
  });

  it("ignores every other endpoint", async () => {
    await recordEndpointOutcome(
      hookContext({ path: "/get-session", returned: {} }),
    );

    expect(recordSecurityEvent).not.toHaveBeenCalled();
  });
});

describe("session and account hooks", () => {
  const session = { userId: "user-1" };

  it("names the sign-in method from the endpoint that made the session", async () => {
    await recordSignIn(session, hookContext({ path: "/sign-in/email" }));
    await recordSignIn(
      session,
      hookContext({ path: "/callback/:id", params: { id: "google" } }),
    );
    await recordSignIn(session, hookContext({ path: "/verify-email" }));
    await recordSignIn(
      session,
      hookContext({ path: "/callback/:id", params: { id: "evil" } }),
    );

    expect(
      recordSecurityEvent.mock.calls.map(([, input]) => input.payload.method),
    ).toEqual(["password", "google", "email_link", "other"]);
  });

  it("records no sign-in for the session a reauth proof or a password change makes", async () => {
    await recordSignIn(session, hookContext({ path: "/reauth/verify-code" }));
    await recordSignIn(session, hookContext({ path: "/change-password" }));

    expect(recordSecurityEvent).not.toHaveBeenCalled();
  });

  it("records a sign-out and not the sessions a reset or deletion removes", async () => {
    await recordSignOut(session, hookContext({ path: "/sign-out" }));
    await recordSignOut(session, hookContext({ path: "/reset-password" }));
    await recordSignOut(session, hookContext({ path: "/delete-user" }));

    expect(recordSecurityEvent).toHaveBeenCalledExactlyOnceWith(
      "session_logout",
      {
        userId: "user-1",
        headers,
      },
    );
  });

  it("records a linked or unlinked provider but not the password account", async () => {
    const google = { userId: "user-1", providerId: "google" };

    await recordIdentityLinked(google, hookContext({ path: "/callback/:id" }));
    await recordIdentityLinked(
      { userId: "user-1", providerId: "credential" },
      hookContext({ path: "/sign-up/email" }),
    );
    await recordIdentityUnlinked(
      google,
      hookContext({ path: "/unlink-account" }),
    );
    await recordIdentityUnlinked(google, hookContext({ path: "/delete-user" }));

    expect(recordSecurityEvent.mock.calls).toEqual([
      [
        "authn_identity_linked",
        { userId: "user-1", headers, payload: { provider: "google" } },
      ],
      [
        "authn_identity_unlinked",
        { userId: "user-1", headers, payload: { provider: "google" } },
      ],
    ]);
  });
});
