"use client";

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
  const { form, token, ready, onSubmit } = useResetPasswordForm(open);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Nova lozinka"
      description="Postavi novu lozinku za svoj Disscount račun."
      formId="reset-password-form"
      submitLabel="Postavi lozinku"
      submitLoading={form.formState.isSubmitting}
      submitDisabled={!token}
      cancelLabel="Odustani"
    >
      {ready && !token ? (
        <p className="text-sm text-destructive">
          Nedostaje token. Zatraži novu poveznicu putem „Zaboravljena lozinka?“
          na prijavi.
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
              label="Nova lozinka"
              autoComplete="new-password"
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Potvrdi novu lozinku"
              autoComplete="new-password"
            />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
