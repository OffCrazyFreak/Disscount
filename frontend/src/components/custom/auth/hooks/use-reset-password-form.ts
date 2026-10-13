import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import {
  isPasswordPolicyCode,
  passwordSchema,
} from "@/lib/auth/password-policy";
import { authClient } from "@/lib/auth/client";
import { swapModalUrl } from "@/lib/modal/modal-navigation";

const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function useResetPasswordForm(open: boolean) {
  const t = useTranslations("auth");
  // Adjust-during-render, so capture still works when `open` flips true.
  const [captured, setCaptured] = useState<{ token: string | null } | null>(
    null,
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
      // Refused before the token is consumed, so the same link still works for a retry.
      if (isPasswordPolicyCode(error.code)) {
        form.setError("password", { type: "server", message: error.message });
        return;
      }

      toast.error(t("resetPassword.invalidLink"));
      return;
    }

    toast.success(t("resetPassword.success"));
    swapModalUrl({ name: "login" });
  }

  return { form, token, ready, onSubmit };
}
