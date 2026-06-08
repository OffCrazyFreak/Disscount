"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { signUp } from "@/lib/auth-client";
import { useUser } from "@/context/user-context";

interface ISignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: ISignUpFormProps) {
  const { handleUserLogin } = useUser();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterRequest) => {
    form.clearErrors("root");

    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      const message =
        error.status === 422
          ? "Korisnik s tim emailom već postoji"
          : error.message || "Greška pri registraciji";
      form.setError("root", { type: "server", message });
      return;
    }

    toast.success("Uspješno ste se registrirali!");
    form.reset();
    // autoSignIn is enabled, so a session already exists — load the profile.
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
          <Label htmlFor="name">Ime</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ivan Horvat"
            {...form.register("name")}
            className={cn(form.formState.errors.name && "border-red-700")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-700">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

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
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Registriraj se"
          )}
        </Button>
      </form>
    </Form>
  );
}
