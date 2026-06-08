"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRequestSchema, LoginRequest } from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";
import { signIn } from "@/lib/auth-client";
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
  const { handleUserLogin } = useUser();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    form.clearErrors("root");

    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const message =
        error.status === 401 || error.status === 403
          ? "Neispravan email ili lozinka"
          : error.message || "Greška pri prijavi";
      form.setError("root", { type: "server", message });
      return;
    }

    toast.success("Prijava uspješna!");
    form.reset();
    await handleUserLogin();
    onSuccess?.();
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

        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lozinka</FormLabel>
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
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Prijavi se"
          )}
        </Button>
      </form>
    </Form>
  );
}
