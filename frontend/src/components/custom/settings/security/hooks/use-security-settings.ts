"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth/client";
import { useUser } from "@/context/user-context";
import {
  buildCredentialsSchema,
  CredentialsFormValues,
} from "@/components/custom/settings/security/credentials-schema";
import { useCredentialsSubmit } from "@/components/custom/settings/security/hooks/use-credentials-submit";

interface LinkedAccount {
  providerId: string;
  accountId: string;
}

// Owns the Sigurnost tab's data + credentials form so the shared modal footer
// (which lives in a parent) can drive its submit, reset and dirty state.
export function useSecuritySettings(active: boolean) {
  const { user } = useUser();
  const currentEmail = user?.email ?? "";

  const query = useQuery({
    queryKey: ["linked-accounts"],
    enabled: active,
    queryFn: async (): Promise<LinkedAccount[]> => {
      const { data, error } = await authClient.listAccounts();
      if (error || !data) throw new Error("Failed to load accounts");
      return data.map((a) => ({
        providerId: a.providerId,
        accountId: a.accountId,
      }));
    },
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

  // Keep the email field in sync with the loaded account unless mid-edit.
  useEffect(() => {
    if (!form.formState.dirtyFields.email) {
      form.resetField("email", { defaultValue: currentEmail });
    }
  }, [currentEmail, form]);

  const { submit } = useCredentialsSubmit({
    hasPassword,
    currentEmail,
    form,
    onChanged: query.refetch,
  });

  return {
    status: query.status,
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
