import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { passwordSchema } from "@/lib/api/schemas/auth-user";
import { authClient } from "@/lib/auth/client";
import { swapModalUrl } from "@/lib/modal/modal-navigation";

const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function useResetPasswordForm(open: boolean) {
  // Capture the token the first render the modal is open (adjust-during-render,
  // so it works when `open` flips true), then strip it from the URL in an effect.
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
      toast.error("Poveznica je nevažeća ili je istekla. Zatraži novu.");
      return;
    }

    toast.success("Lozinka je postavljena. Sada se možeš prijaviti.");
    swapModalUrl({ name: "login" });
  }

  return { form, token, ready, onSubmit };
}
