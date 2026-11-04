"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { useUser } from "@/context/user-context";
import {
  buildCredentialsSchema,
  CredentialsFormValues,
} from "@/components/custom/settings/security/credentials-schema";
import { useCredentialsSubmit } from "@/components/custom/settings/security/hooks/use-credentials-submit";
import { usePasswordRecovery } from "@/components/custom/settings/security/hooks/use-password-recovery";
import { useReauth } from "@/components/custom/settings/security/hooks/use-reauth";
import { listLinkedAccounts } from "@/components/custom/settings/security/list-linked-accounts";

export function useSecuritySettings(active: boolean) {
  const { user } = useUser();
  const currentEmail = user?.email ?? "";

  const query = useQuery({
    queryKey: ["linked-accounts"],
    enabled: active,
    queryFn: listLinkedAccounts,
  });

  const accounts = query.data ?? [];
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const hasLinkedSocial = accounts.some((a) => a.providerId !== "credential");

  const schema = useMemo(
    () => buildCredentialsSchema(hasPassword),
    [hasPassword],
  );

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: currentEmail,
      newPassword: "",
      currentPassword: "",
    },
  });

  // reset, since resetField skips a field the closed tab has not registered; keepDirtyValues here, not in resetOptions, so the footer's Reset still discards edits.
  useEffect(() => {
    form.reset(
      { email: currentEmail, newPassword: "", currentPassword: "" },
      { keepDirtyValues: true, keepDirty: true },
    );
  }, [currentEmail, form]);

  // A password is the proof when the account has one; otherwise a code mailed to it.
  const reauth = useReauth(hasPassword ? "password" : "code");

  const { submit } = useCredentialsSubmit({
    hasPassword,
    currentEmail,
    form,
    reauth,
    onChanged: query.refetch,
  });

  // Lifted so the label-row trigger and the notice below the form share state.
  const recovery = usePasswordRecovery();

  return {
    status: query.status,
    recovery,
    reauth,
    accounts,
    hasPassword,
    hasLinkedSocial,
    canEditEmail: hasPassword && !hasLinkedSocial,
    form,
    submit,
    reload: query.refetch,
  };
}

export type SecuritySettings = ReturnType<typeof useSecuritySettings>;
