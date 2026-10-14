"use client";

import { useFormState } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import AuthFormShell from "@/components/custom/auth/components/forms/auth-form-shell";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import InboxNotice from "@/components/custom/common/inbox-notice";
import { useSignupForm } from "@/components/custom/auth/hooks/use-signup-form";
import { usePasswordPolicy } from "@/components/custom/auth/hooks/use-password-policy";

interface ISignUpFormProps {
  externalDisabled?: boolean;
}

export default function SignUpForm({ externalDisabled }: ISignUpFormProps) {
  const t = useTranslations("auth");
  const { hint } = usePasswordPolicy();
  const { form, onSubmit, submittedEmail } = useSignupForm();
  const formState = useFormState({ control: form.control });

  if (submittedEmail) {
    return (
      <InboxNotice
        title={t("inbox.title")}
        description={t("signup.inboxDescription")}
        email={submittedEmail}
      />
    );
  }

  return (
    <AuthFormShell form={form} onSubmit={onSubmit}>
      <PasswordField
        control={form.control}
        name="password"
        label={t("fields.password")}
        autoComplete="new-password"
        hasError={!!formState.errors.password}
        description={hint}
      />

      <PasswordField
        control={form.control}
        name="confirmPassword"
        label={t("fields.confirmPassword")}
        autoComplete="new-password"
        hasError={!!formState.errors.confirmPassword}
      />

      <Button
        type="submit"
        size="lg"
        effect="gradientSlideShow"
        className="w-full"
        icon={UserPlus}
        iconPlacement="left"
        loading={formState.isSubmitting}
        loadingText={t("signup.submitting")}
        loadingIconPlacement="left"
        disabled={formState.isSubmitting || externalDisabled}
      >
        {t("actions.signUp")}
      </Button>
    </AuthFormShell>
  );
}
