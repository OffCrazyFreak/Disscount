import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  registerRequestSchema,
  RegisterRequest,
} from "@/lib/api/schemas/auth-user";

export function useSignupForm() {
  // Verification is required, so registration shows an inbox notice, not a session.
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
      // The endpoint responds identically either way, so it can't enumerate accounts.
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
