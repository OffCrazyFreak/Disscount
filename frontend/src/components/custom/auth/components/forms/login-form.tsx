"use client";

import { useFormState } from "react-hook-form";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import AuthFormShell from "@/components/custom/auth/components/forms/auth-form-shell";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import ForgotPasswordLink from "@/components/custom/form/forgot-password-link";
import LastLoginBadge from "@/components/custom/auth/components/last-login-badge";
import BreachedPasswordNotice from "@/components/custom/auth/components/breached-password-notice";
import { useLoginForm } from "@/components/custom/auth/hooks/use-login-form";

interface ILoginFormProps {
  onSuccess?: () => void;
  onForgotPassword: () => void;
  isLastUsed?: boolean;
  externalDisabled?: boolean;
}

export default function LoginForm({
  onSuccess,
  onForgotPassword,
  isLastUsed,
  externalDisabled,
}: ILoginFormProps) {
  const t = useTranslations("auth");
  const { form, onSubmit, breachedEmail, clearBreached } =
    useLoginForm(onSuccess);
  const formState = useFormState({ control: form.control });

  if (breachedEmail) {
    return (
      <BreachedPasswordNotice
        email={breachedEmail}
        onBackToLogin={clearBreached}
      />
    );
  }

  return (
    <AuthFormShell form={form} onSubmit={onSubmit}>
      <PasswordField
        control={form.control}
        name="password"
        label={t("fields.password")}
        autoComplete="current-password"
        hasError={!!formState.errors.password}
        action={<ForgotPasswordLink onClick={onForgotPassword} />}
      />

      <Button
        type="submit"
        size="lg"
        effect="gradientSlideShow"
        className="w-full"
        icon={LogIn}
        iconPlacement="left"
        loading={formState.isSubmitting}
        loadingText={t("login.submitting")}
        loadingIconPlacement="left"
        disabled={formState.isSubmitting || externalDisabled}
      >
        {t("actions.logIn")}
        {isLastUsed && !formState.isSubmitting && !externalDisabled && (
          <LastLoginBadge variant="inverse" />
        )}
      </Button>
    </AuthFormShell>
  );
}
