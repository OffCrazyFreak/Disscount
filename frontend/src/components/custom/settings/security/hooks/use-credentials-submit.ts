"use client";

import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";

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
  const { refreshUser } = useUser();

  async function setInitialPassword(data: CredentialsFormValues) {
    const response = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: data.newPassword }),
    });

    if (!response.ok) {
      form.setError("newPassword", {
        message: "settings.security.submit.setPasswordFailed",
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
      if (!wantPasswordChange) {
        const { error: passwordError } = await authClient.signIn.email({
          email: currentEmail,
          password: data.currentPassword,
        });

        if (passwordError) {
          form.setError("currentPassword", {
            message: "settings.security.submit.currentPasswordWrong",
          });
          return;
        }
      }

      // Guarded endpoint that enforces "no social linked" server-side.
      const response = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: data.email }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        form.setError("email", {
          message:
            body.error === "social_linked"
              ? "settings.security.submit.socialLinked"
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
      form.setError("root", {
        message: "settings.security.submit.generic",
      });
    }
  }

  return { submit };
}
