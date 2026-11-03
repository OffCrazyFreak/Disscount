"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/custom/form/password-input";
import ForgotPasswordLink from "@/components/custom/form/forgot-password-link";

interface IReauthPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  errorId?: string;
  onForgotPassword: () => void;
  isSendingRecovery: boolean;
}

export default function ReauthPasswordField({
  value,
  onChange,
  errorId,
  onForgotPassword,
  isSendingRecovery,
}: IReauthPasswordFieldProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="reauth-password">
          {t("security.credentials.currentPassword")}
        </Label>
        <ForgotPasswordLink
          onClick={onForgotPassword}
          sending={isSendingRecovery}
        />
      </div>

      <PasswordInput
        id="reauth-password"
        autoComplete="current-password"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId ?? "reauth-password-hint"}
      />

      <p id="reauth-password-hint" className="text-sm text-muted-foreground">
        {t("security.reauth.passwordHint")}
      </p>
    </div>
  );
}
