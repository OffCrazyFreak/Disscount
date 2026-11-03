import { authClient } from "@/lib/auth/client";
import {
  CODE_EXPIRED,
  CODE_RESEND_TOO_SOON,
  INVALID_CODE,
  REAUTH_REQUIRED,
} from "@/lib/auth/security-policy";

export type ReauthMethod = "password" | "code";

export type ReauthProof = { password: string } | { code: string };

export interface IProofFailure {
  reason: "wrong-password" | "wrong-code" | "code-expired" | "too-many" | "failed";
  attemptsLeft?: number;
}

export interface IAuthError {
  status: number;
  code?: string;
  attemptsLeft?: unknown;
  retryAfter?: unknown;
}

export function needsProof(error: IAuthError | null | undefined): boolean {
  return error?.code === REAUTH_REQUIRED;
}

export function proofFailureFrom(
  error: IAuthError | null | undefined,
): IProofFailure | null {
  if (!error) return null;

  switch (error.code) {
    case "INVALID_PASSWORD":
      return { reason: "wrong-password" };
    case INVALID_CODE:
      return {
        reason: "wrong-code",
        attemptsLeft:
          typeof error.attemptsLeft === "number"
            ? error.attemptsLeft
            : undefined,
      };
    case CODE_EXPIRED:
      return { reason: "code-expired" };
  }

  return { reason: error.status === 429 ? "too-many" : "failed" };
}

/** Proves it is the owner; on success the server has renewed this device's session. */
export async function prove(proof: ReauthProof) {
  const { error } =
    "password" in proof
      ? await authClient.reauth.verifyPassword(proof)
      : await authClient.reauth.verifyCode(proof);

  return proofFailureFrom(error);
}

export type CodeDelivery = "sending" | "sent" | "too-many" | "failed";

export async function sendReauthCode(): Promise<{
  delivery: CodeDelivery;
  retryAfterSeconds?: number;
}> {
  const { error } = await authClient.reauth.sendCode();
  if (!error) return { delivery: "sent" };

  // A code from under a minute ago is still live, so the dialog can use that one.
  if (error.code === CODE_RESEND_TOO_SOON) {
    const retryAfter: unknown = (error as IAuthError).retryAfter;
    return {
      delivery: "sent",
      retryAfterSeconds: typeof retryAfter === "number" ? retryAfter : undefined,
    };
  }

  return { delivery: error.status === 429 ? "too-many" : "failed" };
}
