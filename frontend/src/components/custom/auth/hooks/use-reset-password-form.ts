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
import { usePasswordPolicy } from "@/components/custom/auth/hooks/use-password-policy";
import { authClient } from "@/lib/auth/client";
import { swapModalUrl } from "@/lib/modal/modal-navigation";

const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// The token leaves the URL once read, so a language switch, which remounts the modal
// under the new [locale], would otherwise lose it. Session-scoped, cleared on close.
const TOKEN_KEY = "disscount-reset-token";

function readToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("token");
  if (fromUrl) sessionStorage.setItem(TOKEN_KEY, fromUrl);
  return fromUrl ?? sessionStorage.getItem(TOKEN_KEY);
}

export function useResetPasswordForm(open: boolean) {
  const t = useTranslations("auth");
  const { messageForCode } = usePasswordPolicy();
  // Adjust-during-render, so capture still works when `open` flips true.
  const [captured, setCaptured] = useState<{ token: string | null } | null>(
    null,
  );

  if (open && !captured && typeof window !== "undefined") {
    setCaptured({ token: readToken() });
  }
  if (!open && captured) setCaptured(null);

  const token = captured?.token ?? null;
  const ready = captured !== null;

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!open) {
      sessionStorage.removeItem(TOKEN_KEY);
      return;
    }

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
        form.setError("password", {
          type: "server",
          message: messageForCode(error.code),
        });
        return;
      }

      toast.error(t("resetPassword.invalidLink"));
      return;
    }

    sessionStorage.removeItem(TOKEN_KEY);
    toast.success(t("resetPassword.success"));
    swapModalUrl({ name: "login" });
  }

  return { form, token, ready, onSubmit };
}
