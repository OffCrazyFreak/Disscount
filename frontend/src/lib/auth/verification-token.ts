import "server-only";

export interface IVerificationTokenClaims {
  email: string;
  exp: number;
  updateTo?: string;
  requestType?: string;
}

// better-auth signs this token, and verifies it on /verify-email, before our hooks see it,
// so the payload is read, not verified again.
export function readVerificationToken(token: string): IVerificationTokenClaims {
  const payload = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}
