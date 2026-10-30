"use client";

import { useFormState } from "react-hook-form";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import InboxNotice from "@/components/custom/common/inbox-notice";
import { useForgotPasswordForm } from "@/components/custom/auth/hooks/use-forgot-password-form";

interface IForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: IForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const { form, onSubmit, submittedEmail } = useForgotPasswordForm();
  const formState = useFormState({ control: form.control });

  if (submittedEmail) {
    return (
      <InboxNotice
        title={t("inbox.title")}
        description={t("forgot.inboxDescription")}
        email={submittedEmail}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("forgot.intro")}</p>

      <EmailField
        id="forgot-email"
        registration={form.register("email")}
        error={formState.errors.email?.message}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        icon={Send}
        iconPlacement="left"
        loading={formState.isSubmitting}
        loadingText={t("forgot.sending")}
        loadingIconPlacement="left"
      >
        {t("forgot.submit")}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="cursor-pointer text-sm text-primary underline hover:text-primary/80"
      >
        {t("forgot.backToLogin")}
      </button>
    </form>
  );
}
