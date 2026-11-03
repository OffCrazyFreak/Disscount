import type { IProofFailure } from "@/components/custom/settings/security/reauth/reauth-requests";

// Keys under the settings namespace; the password ones reuse the credentials form's copy.
export function proofFailureMessage(failure: IProofFailure) {
  switch (failure.reason) {
    case "wrong-password":
      return { key: "security.submit.currentPasswordWrong" } as const;
    case "wrong-code":
      return failure.attemptsLeft === undefined
        ? ({ key: "security.reauth.wrongCode" } as const)
        : ({
            key: "security.reauth.wrongCodeAttempts",
            values: { attemptsLeft: failure.attemptsLeft },
          } as const);
    case "code-expired":
      return { key: "security.reauth.codeExpired" } as const;
    case "too-many":
      return { key: "security.submit.tooManyAttempts" } as const;
    case "failed":
      return { key: "security.submit.generic" } as const;
  }
}
