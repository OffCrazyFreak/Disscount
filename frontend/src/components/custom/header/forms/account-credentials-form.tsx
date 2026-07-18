"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  buildCredentialsSchema,
  CredentialsFormValues,
} from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";
import { useCredentialsSubmit } from "@/components/custom/header/forms/use-credentials-submit";

interface IAccountCredentialsFormProps {
  hasPassword: boolean;
  hasLinkedSocial: boolean;
  onChanged: () => void;
}

export default function AccountCredentialsForm({
  hasPassword,
  hasLinkedSocial,
  onChanged,
}: IAccountCredentialsFormProps) {
  const { user } = useUser();
  const currentEmail = user?.email ?? "";

  // "One email defines the user": the email is editable only with a password AND no social
  // account linked, so a provider login can never carry a different email than the account.
  const canEditEmail = hasPassword && !hasLinkedSocial;

  const schema = useMemo(() => buildCredentialsSchema(hasPassword), [hasPassword]);

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: currentEmail,
      newPassword: "",
      currentPassword: "",
    },
  });

  // Re-sync the email field when the loaded account email changes (unless the
  // user is mid-edit on it).
  useEffect(() => {
    if (!form.formState.dirtyFields.email) {
      form.resetField("email", { defaultValue: currentEmail });
    }
  }, [currentEmail, form]);

  const { submit } = useCredentialsSubmit({
    hasPassword,
    currentEmail,
    form,
    onChanged,
  });

  const newPassword = form.watch("newPassword");
  const currentPassword = form.watch("currentPassword");
  const saveDisabled =
    form.formState.isSubmitting ||
    (hasPassword ? currentPassword.trim() === "" : newPassword.trim() === "");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  disabled={!canEditEmail}
                />
              </FormControl>
              {!hasPassword && (
                <FormDescription>
                  Postavi lozinku da bi mogao promijeniti email.
                </FormDescription>
              )}
              {hasPassword && hasLinkedSocial && (
                <FormDescription>
                  Za promjenu emaila prvo odspoji povezane račune (Google,
                  Facebook).
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{hasPassword ? "Nova lozinka" : "Lozinka"}</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete="new-password" />
              </FormControl>
              {hasPassword && (
                <FormDescription>
                  Ostavi prazno ako ne mijenjaš lozinku.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {hasPassword && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trenutna lozinka</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="current-password" />
                </FormControl>
                <FormDescription>
                  Potrebna za promjenu emaila ili lozinke.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.formState.errors.root && (
          <p className="text-xs text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          icon={Save}
          iconPlacement="left"
          disabled={saveDisabled}
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Spremi
        </Button>
      </form>
    </Form>
  );
}
