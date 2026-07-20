"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import FormRootError from "@/components/custom/auth/components/fields/form-root-error";
import InboxNotice from "@/components/custom/auth/components/inbox-notice";
import { useSignupForm } from "@/components/custom/auth/hooks/use-signup-form";

interface ISignUpFormProps {
  externalDisabled?: boolean;
}

export default function SignUpForm({ externalDisabled }: ISignUpFormProps) {
  const { form, onSubmit, submittedEmail } = useSignupForm();

  if (submittedEmail) {
    return (
      <InboxNotice
        title="Provjeri svoj inbox"
        description="Poslali smo ti email s poveznicom za dovršetak registracije na:"
        email={submittedEmail}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormRootError message={form.formState.errors.root?.message} />

        <EmailField
          registration={form.register("email")}
          error={form.formState.errors.email?.message}
        />

        <PasswordField
          control={form.control}
          name="password"
          label="Lozinka"
          autoComplete="new-password"
          hasError={!!form.formState.errors.password}
        />

        <PasswordField
          control={form.control}
          name="confirmPassword"
          label="Potvrdi lozinku"
          autoComplete="new-password"
          hasError={!!form.formState.errors.confirmPassword}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          icon={UserPlus}
          iconPlacement="left"
          loading={form.formState.isSubmitting}
          loadingText="Registracija..."
          loadingIconPlacement="left"
          disabled={form.formState.isSubmitting || externalDisabled}
        >
          Registriraj se
        </Button>
      </form>
    </Form>
  );
}
