"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { signUpSchema, SignUpForm as SignUpFormType } from "@/lib/auth-schemas";
import { cn } from "@/lib/utils";

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { register } = useAuth();

  const form = useForm<SignUpFormType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormType) => {
      await register(data.email, data.password);
    },
    onSuccess: () => {
      toast.success("Uspješno ste se registrirali!");
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Greška pri registraciji");
    },
  });

  const onSubmit = (data: SignUpFormType) => {
    signUpMutation.mutate(data);
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
        disabled={signUpMutation.isPending}
      >
        {signUpMutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Registriraj se"
        )}
      </Button>
    </form>
  );
}
