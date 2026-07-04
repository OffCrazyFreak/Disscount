"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { passwordSchema } from "@/lib/api/schemas/auth-user";
import { authClient } from "@/lib/auth-client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";

interface IAccountCredentialsFormProps {
  hasPassword: boolean;
  hasLinkedSocial: boolean;
  onChanged: () => void;
}

interface FieldErrors {
  email?: string;
  newPassword?: string;
  currentPassword?: string;
}

export default function AccountCredentialsForm({
  hasPassword,
  hasLinkedSocial,
  onChanged,
}: IAccountCredentialsFormProps) {
  const { user, refreshUser } = useUser();
  const t = useTranslations("settings.credentials");
  const tCommon = useTranslations("common");
  const currentEmail = user?.email ?? "";

  // "One email defines the user": the email is editable only with a password AND no social
  // account linked, so a provider login can never carry a different email than the account.
  const canEditEmail = hasPassword && !hasLinkedSocial;

  const [email, setEmail] = useState(currentEmail);
  const [prevEmail, setPrevEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync the editable field when the loaded account email changes — the React-recommended
  // "adjust state during render" pattern, no effect needed.
  if (currentEmail !== prevEmail) {
    setPrevEmail(currentEmail);
    setEmail(currentEmail);
  }

  function validate(): boolean {
    const next: FieldErrors = {};

    if (canEditEmail && email !== currentEmail) {
      if (!z.email().safeParse(email).success) {
        next.email = t("invalidEmail");
      }
    }

    // Social accounts must set a password; password accounts may leave it blank.
    if (!hasPassword || newPassword.length > 0) {
      const result = passwordSchema.safeParse(newPassword);
      if (!result.success) {
        next.newPassword = result.error.issues[0].message;
      }
    }

    if (hasPassword && !currentPassword) {
      next.currentPassword = t("enterCurrentPassword");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSetPassword() {
    const response = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      setErrors({ newPassword: t("setPasswordError") });
      return;
    }

    resetAuthToken();
    await refreshUser();
    onChanged();
    setNewPassword("");
    toast.success(t("passwordSet"));
  }

  async function handleUpdateCredentials() {
    const emailChanged = email !== currentEmail;
    const wantPasswordChange = newPassword.length > 0;

    if (!emailChanged && !wantPasswordChange) {
      toast.info(t("noChanges"));
      return;
    }

    if (wantPasswordChange) {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setErrors({
          currentPassword:
            error.status === 400
              ? t("wrongCurrentPassword")
              : (error.message ?? t("changePasswordError")),
        });
        return;
      }
    }

    if (emailChanged) {
      if (!wantPasswordChange) {
        const { error: passwordError } = await authClient.signIn.email({
          email: currentEmail,
          password: currentPassword,
        });

        if (passwordError) {
          setErrors({ currentPassword: t("wrongCurrentPassword") });
          return;
        }
      }

      // Goes through the guarded endpoint, which enforces "no social linked" server-side.
      const response = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrors({
          email:
            data.error === "social_linked"
              ? t("changeEmailSocialError")
              : t("changeEmailError"),
        });
        return;
      }
    }

    resetAuthToken();
    await refreshUser();
    setNewPassword("");
    setCurrentPassword("");

    if (emailChanged) {
      // changeEmail sends a confirmation to the CURRENT address; the new email applies only
      // after that link is clicked, so revert the field and don't claim it's active yet.
      setEmail(currentEmail);
      toast.success(
        wantPasswordChange
          ? t("passwordChangedEmailPending")
          : t("emailChangePending"),
      );
    } else {
      toast.success(t("passwordChanged"));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (hasPassword) {
        await handleUpdateCredentials();
      } else {
        await handleSetPassword();
      }
    } catch {
      setSubmitError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const saveDisabled =
    isSubmitting ||
    (hasPassword ? currentPassword.trim() === "" : newPassword.trim() === "");

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="account-email">{t("emailLabel")}</Label>
        <Input
          id="account-email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={!canEditEmail}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
        />
        {!hasPassword && (
          <p className="text-xs text-muted-foreground">
            {t("setPasswordHint")}
          </p>
        )}
        {hasPassword && hasLinkedSocial && (
          <p className="text-xs text-muted-foreground">
            {t("socialLinkedHint")}
          </p>
        )}
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="account-new-password">
          {hasPassword ? t("newPasswordLabel") : t("passwordLabel")}
        </Label>
        <PasswordInput
          id="account-new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors((prev) => ({ ...prev, newPassword: undefined }));
          }}
        />
        {hasPassword && (
          <p className="text-xs text-muted-foreground">
            {t("leaveBlankHint")}
          </p>
        )}
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword}</p>
        )}
      </div>

      {hasPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="account-current-password">
            {t("currentPasswordLabel")}
          </Label>
          <PasswordInput
            id="account-current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setErrors((prev) => ({ ...prev, currentPassword: undefined }));
            }}
          />
          <p className="text-xs text-muted-foreground">
            {t("currentPasswordHint")}
          </p>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>
      )}

      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      <Button
        type="submit"
        icon={Save}
        iconPlacement="left"
        disabled={saveDisabled}
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          tCommon("save")
        )}
      </Button>
    </form>
  );
}
