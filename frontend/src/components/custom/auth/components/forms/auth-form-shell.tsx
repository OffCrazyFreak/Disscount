"use client";

import { ReactNode } from "react";
import {
  useFormState,
  type Path,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { Form } from "@/components/ui/form";
import EmailField from "@/components/custom/auth/components/fields/email-field";
import FormRootError from "@/components/custom/common/form-root-error";

interface IEmailValues {
  email: string;
}

interface IAuthFormShellProps<T extends IEmailValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
}

/** An email and password form's frame: the root error and the email field, then the rest. */
export default function AuthFormShell<T extends IEmailValues>({
  form,
  onSubmit,
  children,
}: IAuthFormShellProps<T>) {
  const formState = useFormState({ control: form.control });
  const email = "email" as Path<T>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormRootError message={formState.errors.root?.message} />

        <EmailField
          registration={form.register(email)}
          error={form.getFieldState(email, formState).error?.message}
        />

        {children}
      </form>
    </Form>
  );
}
