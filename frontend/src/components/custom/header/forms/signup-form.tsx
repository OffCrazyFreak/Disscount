"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import {
  registerRequestSchema,
  RegisterRequest,
} from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";
import InboxNotice from "@/components/custom/header/forms/inbox-notice";

interface ISignUpFormProps {
  externalDisabled?: boolean;
}

export function SignUpForm({ externalDisabled }: ISignUpFormProps) {
  // Set once registration succeeds. Email verification is required, so we don't log in —
  // we show a "check your inbox" notice instead.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterRequest) {
    form.clearErrors("root");

    try {
      // The endpoint always responds the same way (no account-existence enumeration):
      // a new email gets a verification link, an existing account a "set/reset password" link.
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!response.ok) {
        form.setError("root", {
          type: "server",
          message: "Provjeri unesene podatke.",
        });
        return;
      }

      setSubmittedEmail(data.email);
      form.reset();
    } catch {
      toast.error("Greška pri registraciji. Pokušaj ponovo.");
    }
  }

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
        {form.formState.errors.root && (
          <div
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
          >
            {form.formState.errors.root.message as string}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lozinka</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    form.formState.errors.password && "border-red-700",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potvrdi lozinku</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    form.formState.errors.confirmPassword && "border-red-700",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting || externalDisabled}
        >
          {form.formState.isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Registriraj se"
          )}
        </Button>
      </form>
    </Form>
  );
}
