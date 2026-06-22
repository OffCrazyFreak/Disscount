"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useUser } from "@/context/user-context";

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

interface IResetPasswordModalProps {
  token: string;
  email?: string;
}

// Opened from the password-reset / set-password email link
// (/reset-password?token=...&email=...). Rendered as a modal over the app, matching the auth
// dialogs. On success the user is signed in automatically with the new password.
export default function ResetPasswordModal({
  token,
  email,
}: IResetPasswordModalProps) {
  const router = useRouter();
  const { handleUserLogin } = useUser();

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function goHome() {
    router.push("/");
  }

  async function onSubmit(data: ResetPasswordFormType) {
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      toast.error("Poveznica je nevažeća ili je istekla. Zatraži novu.");
      return;
    }

    // Sign the user in automatically with the new password when we know the email.
    if (email) {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password: data.password,
      });

      if (!signInError) {
        await handleUserLogin();
        toast.success("Lozinka je postavljena. Prijavljen si!");
        router.push("/");
        return;
      }
    }

    toast.success("Lozinka je postavljena. Sada se možeš prijaviti.");
    router.push("/");
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) goHome();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Nova lozinka</DialogTitle>
          <DialogDescription>
            Postavi novu lozinku za svoj Disscount račun.
          </DialogDescription>
        </DialogHeader>

        {!token ? (
          <p className="text-sm text-red-700">
            Nedostaje token. Zatraži novu poveznicu putem „Zaboravljena
            lozinka?“ na prijavi.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Postavi lozinku"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
