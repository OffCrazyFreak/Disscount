"use client";

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
import { useSecurity } from "@/components/custom/settings/tabs/security-context";

export const CREDENTIALS_FORM_ID = "credentials-form";

// Presentational: the form, submit and account state live in the security
// context so the shared modal footer can drive them (see useSecuritySettings).
export default function AccountCredentialsForm() {
  const { form, submit, hasPassword, hasLinkedSocial, canEditEmail } =
    useSecurity();

  return (
    <Form {...form}>
      <form
        id={CREDENTIALS_FORM_ID}
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4"
      >
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
      </form>
    </Form>
  );
}
