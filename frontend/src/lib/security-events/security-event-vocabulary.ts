// The names follow the OWASP Logging Vocabulary; docs/AUTH.md, 8.6 lists them beside the admin audit actions.
export const SECURITY_EVENT_OUTCOMES = {
  user_created: "success",
  authn_login_success: "success",
  authn_login_fail: "failure",
  authn_login_blocked_breached: "blocked",
  authn_password_change: "success",
  authn_password_reset: "success",
  authn_password_set: "success",
  authn_reauth_success: "success",
  authn_reauth_fail: "failure",
  authn_identity_linked: "success",
  authn_identity_unlinked: "success",
  user_email_change_requested: "success",
  user_email_changed: "success",
  session_logout: "success",
  session_revoked: "success",
} as const;

export type SecurityEventType = keyof typeof SECURITY_EVENT_OUTCOMES;

export const SECURITY_EVENT_TYPES = Object.keys(
  SECURITY_EVENT_OUTCOMES,
) as SecurityEventType[];

export const OUTCOMES = ["success", "failure", "blocked"] as const;

export type SignInMethod =
  "password" | "google" | "facebook" | "email_link" | "other";

export type SignInProvider = "google" | "facebook" | "other";

export type ReauthMethod = "password" | "code";

// Fixed keys and closed values per event, so a payload can never carry an email, a token or free text.
interface ISecurityEventPayloads {
  user_created: { method: SignInMethod };
  authn_login_success: { method: SignInMethod };
  authn_login_fail: { reason: "bad_credentials" | "unverified" | "other" };
  authn_reauth_success: { method: ReauthMethod };
  authn_reauth_fail: { method: ReauthMethod };
  authn_identity_linked: { provider: SignInProvider };
  authn_identity_unlinked: { provider: SignInProvider };
  session_revoked: { scope: "one" | "all" | "others" };
}

export type SecurityEventPayload<E extends SecurityEventType> =
  E extends keyof ISecurityEventPayloads ? ISecurityEventPayloads[E] : never;

export function signInProvider(id: unknown): SignInProvider {
  return id === "google" || id === "facebook" ? id : "other";
}
