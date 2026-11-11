import "server-only";

import type { GenericEndpointContext } from "better-auth";
import { isAPIError } from "better-auth/api";

import { PASSWORD_BREACHED } from "@/lib/auth/password-policy";
import { recordSecurityEvent } from "@/lib/security-events/record-security-event";
import {
  signInProvider,
  type ReauthMethod,
  type SignInMethod,
} from "@/lib/security-events/security-event-vocabulary";

type AuthContext = GenericEndpointContext | null | undefined;

const CREDENTIAL_PROVIDER = "credential";

const SIGN_IN_FAILURE_REASONS: Record<
  string,
  "bad_credentials" | "unverified"
> = {
  INVALID_EMAIL_OR_PASSWORD: "bad_credentials",
  EMAIL_NOT_VERIFIED: "unverified",
};

const REVOKE_SCOPES = {
  "/revoke-session": "one",
  "/revoke-sessions": "all",
  "/revoke-other-sessions": "others",
} as const;

const REAUTH_METHODS = {
  "/reauth/verify-password": "password",
  "/reauth/verify-code": "code",
} as const satisfies Record<string, ReauthMethod>;

function headersOf(ctx: AuthContext) {
  return ctx?.headers ?? ctx?.request?.headers ?? null;
}

function sessionUserId(ctx: AuthContext) {
  return ctx?.context.session?.user.id ?? null;
}

function signInMethod(ctx: AuthContext): SignInMethod {
  switch (ctx?.path) {
    case "/sign-in/email":
    case "/sign-up/email":
      return "password";
    case "/verify-email":
      return "email_link";
    case "/callback/:id":
      return signInProvider(ctx.params?.id);
    case "/sign-in/social":
      return signInProvider(ctx.body?.provider);
    default:
      return "other";
  }
}

function errorCode(returned: unknown) {
  if (!isAPIError(returned)) return undefined;

  const code: unknown = returned.body?.code;
  return typeof code === "string" ? code : undefined;
}

type HookContext = GenericEndpointContext & { context: { returned?: unknown } };

const ACCOUNT_CHANGE_EVENTS = {
  "/change-password": "authn_password_change",
  "/change-email": "user_email_change_requested",
} as const;

function isPathOf<T extends object>(
  map: T,
  path: string,
): path is Extract<keyof T, string> {
  return Object.hasOwn(map, path);
}

/** hooks.after: what the endpoint returned, an APIError included. A 429 never gets here (docs/AUTH.md, 8.6). */
export async function recordEndpointOutcome(ctx: HookContext) {
  const path = ctx.path ?? "";

  if (path === "/sign-in/email") return recordSignInFailure(ctx);
  if (isPathOf(REAUTH_METHODS, path))
    return recordReauth(ctx, REAUTH_METHODS[path]);
  if (isAPIError(ctx.context.returned)) return;

  const userId = sessionUserId(ctx);
  const headers = headersOf(ctx);

  if (isPathOf(ACCOUNT_CHANGE_EVENTS, path)) {
    await recordSecurityEvent(ACCOUNT_CHANGE_EVENTS[path], { userId, headers });
  } else if (isPathOf(REVOKE_SCOPES, path)) {
    await recordSecurityEvent("session_revoked", {
      userId,
      headers,
      payload: { scope: REVOKE_SCOPES[path] },
    });
  }
}

async function recordSignInFailure(ctx: HookContext) {
  const returned = ctx.context.returned;
  const code = errorCode(returned);

  // refuseBreachedSignIn writes its own row, as only it knows the account.
  if (!isAPIError(returned) || code === PASSWORD_BREACHED) return;

  const typedEmail: unknown = ctx.body?.email;

  await recordSecurityEvent("authn_login_fail", {
    headers: headersOf(ctx),
    typedEmail: typeof typedEmail === "string" ? typedEmail : undefined,
    payload: {
      reason: (code ? SIGN_IN_FAILURE_REASONS[code] : undefined) ?? "other",
    },
  });
}

// A request without a session is refused before any proof is checked, so it is no failed proof.
async function recordReauth(ctx: HookContext, method: ReauthMethod) {
  const userId = sessionUserId(ctx);
  if (!userId) return;

  const failed = isAPIError(ctx.context.returned);

  await recordSecurityEvent(
    failed ? "authn_reauth_fail" : "authn_reauth_success",
    {
      userId,
      headers: headersOf(ctx),
      payload: { method },
    },
  );
}

// A password change and a reauth proof make sessions too, so only these paths are sign-ins.
const SIGN_IN_PATHS = new Set([
  "/sign-in/email",
  "/sign-in/social",
  "/callback/:id",
  "/verify-email",
]);

export async function recordSignIn(
  session: { userId: string },
  ctx: AuthContext,
) {
  if (!ctx?.path || !SIGN_IN_PATHS.has(ctx.path)) return;

  await recordSecurityEvent("authn_login_success", {
    userId: session.userId,
    headers: headersOf(ctx),
    payload: { method: signInMethod(ctx) },
  });
}

// Revocations, resets and account deletion remove sessions too; only a sign-out is recorded from here.
export async function recordSignOut(
  session: { userId: string },
  ctx: AuthContext,
) {
  if (ctx?.path !== "/sign-out") return;

  await recordSecurityEvent("session_logout", {
    userId: session.userId,
    headers: headersOf(ctx),
  });
}

export async function recordUserCreated(
  user: { id: string },
  ctx: AuthContext,
) {
  await recordSecurityEvent("user_created", {
    userId: user.id,
    headers: headersOf(ctx),
    payload: { method: signInMethod(ctx) },
  });
}

// The password account comes from sign-up or set-password, which record themselves.
export async function recordIdentityLinked(
  account: { userId: string; providerId: string },
  ctx: AuthContext,
) {
  if (account.providerId === CREDENTIAL_PROVIDER) return;

  await recordSecurityEvent("authn_identity_linked", {
    userId: account.userId,
    headers: headersOf(ctx),
    payload: { provider: signInProvider(account.providerId) },
  });
}

// Account deletion removes every linked account too, and erasure has its own record.
export async function recordIdentityUnlinked(
  account: { userId: string; providerId: string },
  ctx: AuthContext,
) {
  if (ctx?.path !== "/unlink-account") return;

  await recordSecurityEvent("authn_identity_unlinked", {
    userId: account.userId,
    headers: headersOf(ctx),
    payload: { provider: signInProvider(account.providerId) },
  });
}
