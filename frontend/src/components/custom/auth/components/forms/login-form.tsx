"use client";

import { useFormState } from "react-hook-form";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import ForgotPasswordLink from "@/components/custom/form/forgot-password-link";
import FormRootError from "@/components/custom/common/form-root-error";
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormRootError message={formState.errors.root?.message} />

        <EmailField
          registration={form.register("email")}
          error={formState.errors.email?.message}
        />

        <PasswordField
          control={form.control}
          name="password"
          label="Lozinka"
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
          loadingText="Prijava..."
          loadingIconPlacement="left"
          disabled={formState.isSubmitting || externalDisabled}
        >
          Prijavi se
          {isLastUsed && !formState.isSubmitting && !externalDisabled && (
            <LastLoginBadge variant="inverse" />
          )}
        </Button>
      </form>
    </Form>
  );
}
