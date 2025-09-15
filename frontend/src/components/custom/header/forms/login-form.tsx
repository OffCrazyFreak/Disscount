"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRequestSchema, LoginRequest } from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/api";
import { useUser } from "@/context/user-context";
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
}

export function LoginForm({ onSuccess }: ILoginFormProps) {
  const loginMutation = authService.useLogin();
  const { handleUserLogin } = useUser();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginRequest) => {
    // clear previous root error and start login
    form.clearErrors("root");
    loginMutation.mutate(
      {
        usernameOrEmail: data.usernameOrEmail,
        password: data.password,
      },
      {
        onSuccess: async (response) => {
          toast.success("Prijava uspješna!");
          form.reset();
          // Use handleUserLogin to set user and fetch shopping lists/digital cards
          await handleUserLogin(response.user);
          onSuccess?.();
        },
        onError: (error: unknown) => {
          let status = 0;
          let serverMessage: string | undefined;

          if (axios.isAxiosError(error)) {
            status = error.response?.status ?? 0;
            serverMessage =
              ((error.response?.data as any)?.message as string | undefined) ||
              error.message;
          } else {
            serverMessage = (error as any)?.message || "Unknown error";
          }

          if (status >= 400 && status < 500) {
            // 4xx -> show root form error
            const message =
              status === 401
                ? "Neispravno korisničko ime ili email i lozinka"
                : serverMessage || "Provjeri unesene podatke.";
            form.setError("root", { type: "server", message });
          } else {
            toast.error(serverMessage || "Greška pri prijavi");
          }
        },
      }
    );
  };

  return (
    <>
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
            <Label htmlFor="usernameOrEmail">Korisničko ime ili email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="korisnik@example.com"
              {...form.register("usernameOrEmail")}
              className={cn(
                form.formState.errors.usernameOrEmail && "border-red-700"
              )}
            />
            {form.formState.errors.usernameOrEmail && (
              <p className="text-sm text-red-700">
                {form.formState.errors.usernameOrEmail.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="************"
                      className={cn(
                        form.formState.errors.password && "border-red-700"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
      </Form>
    </>
  );
}
