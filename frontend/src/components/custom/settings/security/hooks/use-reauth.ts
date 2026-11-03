"use client";

import { useState } from "react";

import { REAUTH_CODE_RESEND_SECONDS } from "@/constants/auth";
import {
  prove,
  sendReauthCode,
  type CodeDelivery,
  type IProofFailure,
  type ReauthMethod,
  type ReauthProof,
} from "@/components/custom/settings/security/reauth/reauth-requests";

export interface IReauthCopy {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
}

// Returns a failure to show in the dialog, or null once the action is done.
type ProofSubmit = (proof: ReauthProof) => Promise<IProofFailure | null>;

export interface IReauthRequest extends IReauthCopy {
  id: number;
  submit: ProofSubmit;
}

// "needs-proof" only when the server answered REAUTH_REQUIRED; other outcomes report themselves.
export type FreshAction = () => Promise<"done" | "needs-proof">;

// One dialog for every sensitive action: the server decides when a proof is due, and
// this only mirrors it, so a tampered client still meets the same rule.
export function useReauth(method: ReauthMethod) {
  const [request, setRequest] = useState<IReauthRequest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [delivery, setDelivery] = useState<CodeDelivery>("sending");
  const [resendAt, setResendAt] = useState(0);

  async function sendCode() {
    setDelivery("sending");
    const { delivery: outcome, retryAfterSeconds } = await sendReauthCode();

    setDelivery(outcome);
    if (outcome === "sent") {
      const waitSeconds = retryAfterSeconds ?? REAUTH_CODE_RESEND_SECONDS;
      setResendAt(Date.now() + waitSeconds * 1000);
    }
  }

  function ask(copy: IReauthCopy, submit: ProofSubmit) {
    setRequest({ ...copy, submit, id: (request?.id ?? 0) + 1 });
    setIsOpen(true);
    // Sent the moment the dialog opens, so the code is on its way while it renders.
    if (method === "code") void sendCode();
  }

  /** Runs the action, and only if the server asks for a proof, asks and retries once. */
  async function withFreshSession(action: FreshAction, copy: IReauthCopy) {
    if ((await action()) === "done") return;

    ask(copy, async (proof) => {
      const failure = await prove(proof);
      if (failure) return failure;

      return (await action()) === "done" ? null : { reason: "failed" };
    });
  }

  return {
    method,
    request,
    isOpen,
    delivery,
    resendAt,
    ask,
    withFreshSession,
    resendCode: sendCode,
    close: () => setIsOpen(false),
  };
}

export type Reauth = ReturnType<typeof useReauth>;
