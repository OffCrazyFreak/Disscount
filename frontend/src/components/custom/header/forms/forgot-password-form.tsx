"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import InboxNotice from "@/components/custom/header/forms/inbox-notice";

type ForgotPasswordForm = { email: string };

interface IForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: IForgotPasswordFormProps) {
  const t = useTranslations("auth.forgotPassword");
  const tv = useTranslations("validation");
  const tCommon = useTranslations("common");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  // Built inside the component so the validation message is localized.
  const forgotPasswordSchema = useMemo(
    () => z.object({ email: z.email(tv("invalidEmail")) }),
    [tv],
  );

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordForm) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    try {
      // No email in the URL (it would leak via history/Referer/logs); the link carries the token.
      await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${appUrl}/reset-password`,
      });
    } catch {
      // Only a thrown transport/runtime failure reaches here; API-level { error } is intentionally
      // ignored so the response can't reveal whether the account exists.
      toast.error(t("sendError"));
      return;
    }

    // Same notice regardless of whether the account exists — no enumeration.
    setSubmittedEmail(data.email);
  }

  if (submittedEmail) {
    return (
      <InboxNotice
        title={t("inboxTitle")}
        description={t("inboxDescription")}
        email={submittedEmail}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>

      <div className="grid gap-2">
        <Label htmlFor="forgot-email">{t("emailLabel")}</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder={tCommon("emailPlaceholder")}
          autoComplete="email"
          {...form.register("email")}
          className={cn(form.formState.errors.email && "border-red-700")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-700">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          t("submit")
        )}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="cursor-pointer text-sm text-primary underline hover:text-primary/80"
      >
        {t("backToLogin")}
      </button>
    </form>
  );
}
