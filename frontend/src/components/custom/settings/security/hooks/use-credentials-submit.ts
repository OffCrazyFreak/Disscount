"use client";

import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";
import { isPasswordPolicyCode } from "@/lib/auth/password-policy";
import {
  changeEmailError,
  changePasswordError,
} from "@/components/custom/settings/security/credentials-errors";
import { usePasswordPolicy } from "@/components/custom/auth/hooks/use-password-policy";

interface IUseCredentialsSubmitProps {
  hasPassword: boolean;
  currentEmail: string;
  form: UseFormReturn<CredentialsFormValues>;
  onChanged: () => void;
}

export function useCredentialsSubmit({
  hasPassword,
  currentEmail,
  form,
  onChanged,
}: IUseCredentialsSubmitProps) {
  const t = useTranslations("settings");
  const { messageForCode } = usePasswordPolicy();
  const { refreshUser } = useUser();

  async function setInitialPassword(data: CredentialsFormValues) {
    const response = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: data.newPassword }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: unknown;
      };
      form.setError("newPassword", {
        message: isPasswordPolicyCode(body.error)
          ? messageForCode(body.error)
          : "settings.security.submit.setPasswordFailed",
      });
      return;
    }

    resetAuthToken();
    await refreshUser();
    onChanged();
    form.resetField("newPassword");
    toast.success(t("security.submit.passwordSet"));
  }

  async function confirmPasswordCommitted() {
    resetAuthToken();
    await refreshUser();
    form.resetField("newPassword");
    form.resetField("currentPassword");
  }

  async function changePassword(data: CredentialsFormValues) {
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (!error) return true;

    const { field, message } = changePasswordError(error, messageForCode);
    form.setError(field, { message });
    return false;
  }

  async function changeEmail(
    data: CredentialsFormValues,
    afterPasswordChange: boolean,
  ) {
    // Guarded endpoint that checks the password and "no social linked" server-side.
    const response = await fetch("/api/account/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newEmail: data.email,
        // A password change above already committed, so the new one is now current.
        currentPassword: afterPasswordChange
          ? data.newPassword
          : data.currentPassword,
      }),
    });

    if (response.ok) return true;

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    const { field, message } = changeEmailError(
      body.error,
      afterPasswordChange,
    );
    form.setError(field, { message });

    // Password already committed above; confirm it and clear its fields so a retry only re-does email.
    if (afterPasswordChange) {
      await confirmPasswordCommitted();
      toast.success(t("security.submit.passwordChanged"));
    }
    return false;
  }

  async function updateCredentials(data: CredentialsFormValues) {
    const emailChanged = data.email !== currentEmail;
    const wantPasswordChange = data.newPassword.length > 0;

    if (!emailChanged && !wantPasswordChange) {
      toast.info(t("security.submit.noChanges"));
      return;
    }

    if (wantPasswordChange && !(await changePassword(data))) return;
    if (emailChanged && !(await changeEmail(data, wantPasswordChange))) return;

    await confirmPasswordCommitted();

    if (!emailChanged) {
      toast.success(t("security.submit.passwordChanged"));
      return;
    }

    // The confirmation goes to the CURRENT address and the new email applies only
    // once its link is clicked, so revert the field instead of showing it as active.
    form.resetField("email", { defaultValue: currentEmail });
    toast.success(
      wantPasswordChange
        ? t("security.submit.passwordChangedConfirmEmail")
        : t("security.submit.emailConfirmationSent"),
    );
  }

  async function submit(data: CredentialsFormValues) {
    form.clearErrors("root");
    try {
      if (hasPassword) {
        await updateCredentials(data);
      } else {
        await setInitialPassword(data);
      }
    } catch {
      form.setError("root", { message: t("security.submit.generic") });
    }
  }

  return { submit };
}
