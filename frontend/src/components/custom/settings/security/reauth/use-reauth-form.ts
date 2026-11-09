"use client";

import { useState, type FormEvent } from "react";

import { REAUTH_CODE_LENGTH } from "@/constants/auth";
import type { Reauth } from "@/components/custom/settings/security/hooks/use-reauth";
import type { IProofFailure } from "@/components/custom/settings/security/reauth/reauth-requests";

export function useReauthForm(reauth: Reauth) {
  const { request, method } = reauth;
  const [value, setValue] = useState("");
  const [failure, setFailure] = useState<IProofFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formFor, setFormFor] = useState(request?.id);

  if (request && request.id !== formFor) {
    setFormFor(request.id);
    setValue("");
    setFailure(null);
  }

  const isComplete =
    method === "password"
      ? value.length > 0
      : value.length === REAUTH_CODE_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request || !isComplete || submitting) return;

    setSubmitting(true);
    setFailure(null);

    const result = await request.submit(
      method === "password" ? { password: value } : { code: value },
    );

    setSubmitting(false);
    if (!result) {
      reauth.close();
      return;
    }

    setFailure(result);
    // A wrong password is usually one typo away; a spent code has to be typed fresh.
    if (result.reason !== "wrong-password") setValue("");
  }

  return {
    value,
    setValue,
    failure,
    clearFailure: () => setFailure(null),
    submitting,
    isComplete,
    handleSubmit,
  };
}
