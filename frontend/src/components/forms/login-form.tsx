"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, LoginForm as LoginFormType } from "@/lib/auth-schemas";
import { cn } from "@/lib/searchUtils";
import { authService } from "@/lib/api";
import { useUser } from "@/lib/user-context";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [loginRootError, setLoginRootError] = useState<string | null>(null);
  const loginMutation = authService.useLogin();
  const { setUser } = useUser();

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormType) => {
    // clear previous root error and start login
    setLoginRootError(null);
    loginMutation.mutate(
      {
        usernameOrEmail: data.usernameOrEmail,
        password: data.password,
      },
      {
        onSuccess: (response) => {
          toast.success("Prijava uspješna!");
          form.reset();
          setLoginRootError(null);
          // Set user directly from login response
          setUser(response.user);
          onSuccess?.();
        },
        onError: (error: unknown) => {
          // If backend responds with 401 show a root-level form error in Croatian
          const axiosErr = error as AxiosError | undefined;
          if (axiosErr?.response?.status === 401) {
            setLoginRootError("Neispravno korisničko ime ili email i lozinka");
          } else {
            toast.error(axiosErr?.message || "Greška pri prijavi");
          }
        },
      }
    );
  };

  return (
    <>
      {loginRootError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          {loginRootError}
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="usernameOrEmail">Korisničko ime ili email</Label>
          <Input
            id="usernameOrEmail"
            type="text"
            placeholder="korisnik@example.com"
            {...form.register("usernameOrEmail")}
            className={cn(
              form.formState.errors.usernameOrEmail && "border-red-500"
            )}
          />
          {form.formState.errors.usernameOrEmail && (
            <p className="text-sm text-red-500">
              {form.formState.errors.usernameOrEmail.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Lozinka</Label>
          <Input
            id="password"
            type="password"
            placeholder="************"
            {...form.register("password")}
            className={cn(form.formState.errors.password && "border-red-500")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size={"lg"}
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Prijavi se"
          )}
        </Button>
      </form>
    </>
  );
}
