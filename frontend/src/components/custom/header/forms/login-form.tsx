"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  isLastUsed?: boolean;
}

export function LoginForm({ onSuccess, isLastUsed }: ILoginFormProps) {
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
        const message =
          status === 401 || status === 400
            ? "Neispravni email ili lozinka"
            : result.error.message || "Provjeri unesene podatke.";
        form.setError("root", { type: "server", message });
        return;
      }

      toast.success("Prijava uspješna!");
      form.reset();
      setLastLoginMethod("email");
      await handleUserLogin();
      onSuccess?.();
    } catch {
      toast.error("Greška pri prijavi. Pokušaj ponovo.");
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="korisnik@example.com"
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
              <FormLabel>Lozinka</FormLabel>
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

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Prijavi se"
          )}
          {isLastUsed && !form.formState.isSubmitting && (
            <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <CircleCheck size={9} />
              Zadnja prijava
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
