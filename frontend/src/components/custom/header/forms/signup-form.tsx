"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import {
  registerRequestSchema,
  RegisterRequest,
} from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/api";
import { useUser } from "@/context/user-context";

interface ISignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: ISignUpFormProps) {
  const registerMutation = authService.useRegister();
  const { handleUserLogin } = useUser();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterRequest) => {
    form.clearErrors("root");
    registerMutation.mutate(
      {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: async (response) => {
          toast.success("Uspješno ste se registrirali!");
          form.reset();
          // Use handleUserLogin to set user and fetch shopping lists/digital cards
          await handleUserLogin(response.user);
          onSuccess?.();
        },
        onError: (error: unknown) => {
          let status = 0;
          let serverMessage: string | undefined;

          if (isAxiosError(error)) {
            status = error.response?.status ?? 0;
            serverMessage =
              (error.response?.data as { message?: string })?.message ||
              error.message;
          } else {
            serverMessage = (error as Error)?.message || "Unknown error";
          }

          if (status >= 400 && status < 500) {
            form.setError("root", {
              type: "server",
              message: serverMessage || "Provjeri unesene podatke.",
            });
          } else {
            toast.error(serverMessage || "Greška pri registraciji");
          }
        },
      }
    );
  };

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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="korisnik@example.com"
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
              <FormLabel>Lozinka</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder="********"
                  className={cn(
                    form.formState.errors.password && "border-red-700"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potvrdi lozinku</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder="********"
                  className={cn(
                    form.formState.errors.confirmPassword && "border-red-700"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size={"lg"}
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Registriraj se"
          )}
        </Button>
      </form>
    </Form>
  );
}
