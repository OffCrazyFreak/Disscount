"use client";

import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import PasswordField from "@/components/custom/auth/components/fields/password-field";
import FormRootError from "@/components/custom/auth/components/fields/form-root-error";
import LastLoginBadge from "@/components/custom/auth/components/last-login-badge";
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
  const { form, onSubmit } = useLoginForm(onSuccess);

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
          autoComplete="current-password"
          hasError={!!form.formState.errors.password}
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="-mt-2 justify-self-end cursor-pointer text-sm text-primary underline hover:text-primary/80"
        >
          Zaboravljena lozinka?
        </button>

        <Button
          type="submit"
          size="lg"
          effect="gradientSlideShow"
          className="w-full"
          icon={LogIn}
          iconPlacement="left"
          loading={form.formState.isSubmitting}
          loadingText="Prijava..."
          loadingIconPlacement="left"
          disabled={form.formState.isSubmitting || externalDisabled}
        >
          Prijavi se
          {isLastUsed && !form.formState.isSubmitting && !externalDisabled && (
            <LastLoginBadge variant="inverse" />
          )}
        </Button>
      </form>
    </Form>
  );
}
