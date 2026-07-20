"use client";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import InboxNotice from "@/components/custom/auth/components/inbox-notice";
import { useForgotPasswordForm } from "@/components/custom/auth/hooks/use-forgot-password-form";

interface IForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: IForgotPasswordFormProps) {
  const { form, onSubmit, submittedEmail } = useForgotPasswordForm();

  if (submittedEmail) {
    return (
      <InboxNotice
        title="Provjeri svoj inbox"
        description="Ako račun s tom adresom postoji, poslali smo poveznicu za postavljanje nove lozinke na:"
        email={submittedEmail}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Unesi svoju email adresu i poslat ćemo ti poveznicu za postavljanje nove
        lozinke.
      </p>

      <EmailField
        id="forgot-email"
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        icon={Send}
        iconPlacement="left"
        loading={form.formState.isSubmitting}
        loadingText="Slanje..."
        loadingIconPlacement="left"
      >
        Pošalji poveznicu
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="cursor-pointer text-sm text-primary underline hover:text-primary/80"
      >
        Natrag na prijavu
      </button>
    </form>
  );
}
