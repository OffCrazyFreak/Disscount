"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRequestSchema, LoginRequest } from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";
import { signIn } from "@/lib/auth-client";
import { useUser } from "@/context/user-context";
import { setLastLoginMethod } from "@/utils/browser/local-storage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";

interface ILoginFormProps {
  onSuccess?: () => void;
  onForgotPassword: () => void;
  isLastUsed?: boolean;
  externalDisabled?: boolean;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  isLastUsed,
  externalDisabled,
}: ILoginFormProps) {
  const { handleUserLogin } = useUser();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");

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
          // Email not verified — Better Auth re-sends the verification link on each attempt.
          message = t("emailNotVerified");
        } else if (status === 401 || status === 400) {
          message = t("invalidCredentials");
        } else {
          message = result.error.message || t("checkInput");
        }
        form.setError("root", { type: "server", message });
        return;
      }

      await handleUserLogin();
      toast.success(t("success"));
      form.reset();
      setLastLoginMethod("email");
      onSuccess?.();
    } catch {
      toast.error(t("genericError"));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {form.formState.errors.root && (
          <div
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
          >
            {form.formState.errors.root.message as string}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={tCommon("emailPlaceholder")}
            autoComplete="email"
            {...form.register("email")}
            className={cn(form.formState.errors.email && "border-red-700")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-700">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("passwordLabel")}</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    form.formState.errors.password && "border-red-700"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button
          type="button"
          onClick={onForgotPassword}
          className="-mt-2 justify-self-end cursor-pointer text-sm text-primary underline hover:text-primary/80"
        >
          {t("forgotPassword")}
        </button>

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting || externalDisabled}>
          {form.formState.isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            t("submit")
          )}
          {isLastUsed && !form.formState.isSubmitting && !externalDisabled && (
            <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <CircleCheck size={9} />
              {t("lastUsed")}
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
