import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  registerRequestSchema,
  RegisterRequest,
} from "@/lib/api/schemas/auth-user";

export function useSignupForm() {
  // Set once registration succeeds. Email verification is required, so we don't log in -
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

  return { form, onSubmit, submittedEmail };
}
