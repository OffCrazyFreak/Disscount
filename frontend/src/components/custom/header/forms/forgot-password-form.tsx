"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import InboxNotice from "@/components/custom/header/forms/inbox-notice";

const forgotPasswordSchema = z.object({
  email: z.email("Unesi važeći email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface IForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: IForgotPasswordFormProps) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

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
      toast.error("Greška pri slanju poveznice. Pokušaj ponovo.");
      return;
    }

    // Same notice regardless of whether the account exists — no enumeration.
    setSubmittedEmail(data.email);
  }

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

      <div className="grid gap-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="korisnik@example.com"
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
          "Pošalji poveznicu"
        )}
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
