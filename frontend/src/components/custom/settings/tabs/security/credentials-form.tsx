"use client";

import { KeyRound } from "lucide-react";

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
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import { useSecurity } from "@/components/custom/settings/tabs/security/security-context";

export const CREDENTIALS_FORM_ID = "credentials-form";

export default function CredentialsForm() {
  const { form, submit, hasPassword, canEditEmail } = useSecurity();

  return (
    <SettingsSection
      icon={KeyRound}
      label="Prijava i lozinka"
      hint={
        hasPassword
          ? "Za promjenu emaila ili lozinke potvrdi svoju trenutnu lozinku."
          : "Postavi lozinku da se možeš prijaviti i emailom, ne samo društvenim računom."
      }
    >
      <Form {...form}>
        <form
          id={CREDENTIALS_FORM_ID}
          onSubmit={form.handleSubmit(submit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={!canEditEmail} />
                </FormControl>
                {!canEditEmail && (
                  <FormDescription>
                    {hasPassword
                      ? "Za promjenu emaila prvo odspoji povezane društvene račune."
                      : "Email ćeš moći mijenjati nakon što postaviš lozinku."}
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
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={
                      hasPassword ? "Ostavi prazno ako ne mijenjaš" : undefined
                    }
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Najmanje 12 znakova, jedno veliko i malo slovo te broj.
                </FormDescription>
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
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Potrebna za potvrdu promjene emaila ili lozinke.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </SettingsSection>
  );
}
