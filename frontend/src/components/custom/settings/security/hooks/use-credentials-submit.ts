"use client";

import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";
import { isPasswordPolicyCode } from "@/lib/auth/password-policy";
import { usePasswordPolicy } from "@/components/custom/auth/hooks/use-password-policy";

const TOO_MANY_ATTEMPTS = "settings.security.submit.tooManyAttempts";

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

  async function updateCredentials(data: CredentialsFormValues) {
    const emailChanged = data.email !== currentEmail;
    const wantPasswordChange = data.newPassword.length > 0;

    if (!emailChanged && !wantPasswordChange) {
      toast.info(t("security.submit.noChanges"));
      return;
    }

    if (wantPasswordChange) {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        if (isPasswordPolicyCode(error.code)) {
          form.setError("newPassword", { message: messageForCode(error.code) });
          return;
        }

        form.setError("currentPassword", {
          message:
            error.status === 400
              ? "settings.security.submit.currentPasswordWrong"
              : "settings.security.submit.changePasswordFailed",
        });
        return;
      }
    }

    if (emailChanged) {
      // Guarded endpoint that checks the password and "no social linked" server-side.
      const response = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: data.email,
          // A password change above already committed, so the new one is now current.
          currentPassword: wantPasswordChange
            ? data.newPassword
            : data.currentPassword,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        const tooManyAttempts = body.error === "too_many_attempts";

        // With a password change the check used the new password, so only the email failed
        // and the committed password still needs the cleanup below.
        if (
          !wantPasswordChange &&
          (tooManyAttempts || body.error === "invalid_password")
        ) {
          form.setError("currentPassword", {
            message: tooManyAttempts
              ? TOO_MANY_ATTEMPTS
              : "settings.security.submit.currentPasswordWrong",
          });
          return;
        }

        form.setError("email", {
          message:
            body.error === "social_linked"
              ? "settings.security.submit.socialLinked"
              : tooManyAttempts
                ? TOO_MANY_ATTEMPTS
                : "settings.security.submit.changeEmailFailed",
        });

        // Password already committed above; confirm it and clear its fields so a retry only re-does email.
        if (wantPasswordChange) {
          resetAuthToken();
          await refreshUser();
          form.resetField("newPassword");
          form.resetField("currentPassword");
          toast.success(t("security.submit.passwordChanged"));
        }
        return;
      }
    }

    resetAuthToken();
    await refreshUser();
    form.resetField("newPassword");
    form.resetField("currentPassword");

    if (emailChanged) {
      // The confirmation goes to the CURRENT address and the new email applies only
      // once its link is clicked, so revert the field instead of showing it as active.
      form.resetField("email", { defaultValue: currentEmail });
      toast.success(
        wantPasswordChange
          ? t("security.submit.passwordChangedConfirmEmail")
          : t("security.submit.emailConfirmationSent"),
      );
    } else {
      toast.success(t("security.submit.passwordChanged"));
    }
  }

  async function submit(data: CredentialsFormValues) {
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
