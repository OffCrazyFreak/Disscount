import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";

const forgotPasswordSchema = z.object({
  email: z.email("Unesi važeći email"),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function useForgotPasswordForm() {
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

    // Same notice regardless of whether the account exists - no enumeration.
    setSubmittedEmail(data.email);
  }

  return { form, onSubmit, submittedEmail };
}
