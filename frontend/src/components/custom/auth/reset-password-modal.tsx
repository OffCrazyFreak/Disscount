"use client";

import { useFormState } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useResetPasswordForm } from "@/components/custom/auth/hooks/use-reset-password-form";

interface IResetPasswordModalProps {
  open: boolean;
}

// The token is captured then removed from the URL via replaceState, so it can't leak
// via history or Referer. On success the user is sent to log in, never auto-logged in.
export default function ResetPasswordModal({ open }: IResetPasswordModalProps) {
  const t = useTranslations("auth");
  const { form, token, ready, onSubmit } = useResetPasswordForm(open);
  const formState = useFormState({ control: form.control });

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("resetPassword.title")}
      description={t("resetPassword.description")}
      formId="reset-password-form"
      submitLabel={t("resetPassword.submit")}
      submitLoading={formState.isSubmitting}
      submitDisabled={!token}
      cancelLabel={t("resetPassword.cancel")}
    >
      {ready && !token ? (
        <p className="text-sm text-destructive">
          {t("resetPassword.missingToken")}
        </p>
      ) : (
        <Form {...form}>
          <form
            id="reset-password-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <PasswordField
              control={form.control}
              name="password"
              label={t("resetPassword.newPassword")}
              autoComplete="new-password"
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label={t("resetPassword.confirmNewPassword")}
              autoComplete="new-password"
            />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
