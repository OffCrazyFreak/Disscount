import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import {
  registerRequestSchema,
  RegisterRequest,
} from "@/lib/api/schemas/auth-user";

export function useSignupForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
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
      // Identical response for new and existing accounts (verification vs reset link), so no enumeration.
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          locale,
        }),
      });

      if (!response.ok) {
        form.setError("root", {
          type: "server",
          message: t("errors.checkInput"),
        });
        return;
      }

      setSubmittedEmail(data.email);
      form.reset();
    } catch {
      toast.error(t("signup.error"));
    }
  }

  return { form, onSubmit, submittedEmail };
}
