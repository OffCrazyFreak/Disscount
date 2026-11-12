import "server-only";

export interface IVerificationTokenClaims {
  email: string;
  exp: number;
  updateTo?: string;
  requestType?: string;
}

// better-auth verifies this token before our hooks see it, so the payload is read, not verified again.
export function readVerificationToken(token: string): IVerificationTokenClaims {
  const payload = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}
