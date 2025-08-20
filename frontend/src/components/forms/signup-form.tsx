"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema, SignUpForm as SignUpFormType } from "@/lib/auth-schemas";
import { cn } from "@/lib/searchUtils";
import { authService } from "@/lib/api";
import { useUser } from "@/lib/user-context";

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const registerMutation = authService.useRegister();
  const { setUser } = useUser();

  const form = useForm<SignUpFormType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignUpFormType) => {
    registerMutation.mutate(
      {
        email: data.email,
        password: data.password,
        // Optional fields could be added here if needed
        username: undefined, // Use email as username by default
        notificationsEmail: true, // Default to enabled
        notificationsPush: true, // Default to enabled
      },
      {
        onSuccess: (response) => {
          toast.success("Uspješno ste se registrirali!");
          form.reset();
          // Set user directly from register response
          setUser(response.user);
          onSuccess?.();
        },
        onError: (error: Error) => {
          toast.error(error.message || "Greška pri registraciji");
        },
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="korisnik@example.com"
          {...form.register("email")}
          className={cn(form.formState.errors.email && "border-red-500")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-password">Lozinka</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="********"
          {...form.register("password")}
          className={cn(form.formState.errors.password && "border-red-500")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
          {...form.register("confirmPassword")}
          className={cn(
            form.formState.errors.confirmPassword && "border-red-500"
          )}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

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
  );
}
