"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { ModalShell } from "@/components/ui/modal-shell";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { passwordSchema } from "@/lib/api/schemas/auth-user";
import { authClient } from "@/lib/auth-client";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";

const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// Opened from the reset / set-password email link (as ?modal=reset-password&token=).
// The token is captured into state and immediately stripped from the URL so it
// can't linger in history or leak via the Referer header. On success the user is
// sent to log in (we never auto-login, so no PII rides along).
export function ResetPasswordModal({ open }: { open: boolean }) {
  // Capture the token the first render the modal is open (adjust-during-render,
  // so it works when `open` flips true), then strip it from the URL in an effect.
  const [captured, setCaptured] = useState<{ token: string | null } | null>(
    null
  );

  if (open && !captured && typeof window !== "undefined") {
    setCaptured({
      token: new URLSearchParams(window.location.search).get("token"),
    });
  }
  if (!open && captured) setCaptured(null);

  const token = captured?.token ?? null;
  const ready = captured !== null;

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has("token")) return;

    params.delete("token");
    const query = params.toString().replace(/%2F/g, "/");
    const url = window.location.pathname + (query ? `?${query}` : "");
    window.history.replaceState(window.history.state, "", url);
  }, [open]);

  async function onSubmit(data: ResetPasswordForm) {
    if (!token) return;

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      toast.error("Poveznica je nevažeća ili je istekla. Zatraži novu.");
      return;
    }

    toast.success("Lozinka je postavljena. Sada se možeš prijaviti.");
    swapModalUrl({ name: "login" });
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Nova lozinka"
      description="Postavi novu lozinku za svoj Disscount račun."
      formId="reset-password-form"
      submitLabel="Postavi lozinku"
      submitLoading={form.formState.isSubmitting}
      submitDisabled={!token}
      cancelLabel="Odustani"
    >
      {ready && !token ? (
        <p className="text-sm text-destructive">
          Nedostaje token. Zatraži novu poveznicu putem „Zaboravljena lozinka?“
          na prijavi.
        </p>
      ) : (
        <Form {...form}>
          <form
            id="reset-password-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova lozinka</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                  <FormLabel>Potvrdi novu lozinku</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
