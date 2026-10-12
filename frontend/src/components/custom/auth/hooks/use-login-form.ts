import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginRequestSchema, LoginRequest } from "@/lib/api/schemas/auth-user";
import { signIn } from "@/lib/auth/client";
import { useUser } from "@/context/user-context";
import { setLastLoginMethod } from "@/utils/browser/local-storage";

export function useLoginForm(onSuccess?: () => void) {
  const t = useTranslations("auth");
  const { handleUserLogin } = useUser();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginRequest) {
    form.clearErrors("root");

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        const status = result.error.status ?? 0;
        let message: string;
        if (status === 403) {
          // Email not verified - Better Auth re-sends the verification link on each attempt.
          message = t("errors.emailNotVerified");
        } else if (status === 401 || status === 400) {
          message = t("errors.invalidCredentials");
        } else {
          message = result.error.message || t("errors.checkInput");
        }
        form.setError("root", { type: "server", message });
        return;
      }

      await handleUserLogin();
      toast.success(t("login.success"));
      form.reset();
      setLastLoginMethod("email");
      onSuccess?.();
    } catch {
      toast.error(t("login.error"));
    }
  }

  return { form, onSubmit };
}
