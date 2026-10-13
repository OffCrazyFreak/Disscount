"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/custom/form/password-input";
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
import ForgotPasswordLink from "@/components/custom/form/forgot-password-link";
import PasswordRecovery from "@/components/custom/settings/security/components/password-recovery";
import { useSecurity } from "@/components/custom/settings/security/security-context";
import { usePasswordPolicy } from "@/components/custom/auth/hooks/use-password-policy";

export const CREDENTIALS_FORM_ID = "credentials-form";

export default function CredentialsForm() {
  const t = useTranslations("settings");
  const { hint } = usePasswordPolicy();
  const { form, submit, hasPassword, canEditEmail, recovery } = useSecurity();

  return (
    <SettingsSection
      icon={KeyRound}
      label={t("security.credentials.label")}
      hint={
        hasPassword
          ? t("security.credentials.hintWithPassword")
          : t("security.credentials.hintWithoutPassword")
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
                <FormLabel>{t("security.credentials.email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={!canEditEmail} />
                </FormControl>
                {!canEditEmail && (
                  <FormDescription>
                    {hasPassword
                      ? t("security.credentials.emailLockedSocial")
                      : t("security.credentials.emailLockedNoPassword")}
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
                <FormLabel>
                  {hasPassword
                    ? t("security.credentials.newPassword")
                    : t("security.credentials.password")}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={
                      hasPassword
                        ? t("security.credentials.newPasswordPlaceholder")
                        : undefined
                    }
                    {...field}
                  />
                </FormControl>
                <FormDescription>{hint}</FormDescription>
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
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>
                      {t("security.credentials.currentPassword")}
                    </FormLabel>
                    {!recovery.sentTo && (
                      <ForgotPasswordLink
                        onClick={recovery.send}
                        sending={recovery.sending}
                      />
                    )}
                  </div>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("security.credentials.currentPasswordDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>

      <PasswordRecovery />
    </SettingsSection>
  );
}
