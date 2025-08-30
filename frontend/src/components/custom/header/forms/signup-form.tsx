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
import { cn } from "@/lib/utils/generic";
import { authService } from "@/lib/api";
import { useUser } from "@/lib/context/user-context";

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
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
        onError: (error: Error) => {
          toast.error(error.message || "Greška pri registraciji");
        },
      }
    );
  };

  return (
    <Form {...form}>
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
                    form.formState.errors.password && "border-red-500"
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
                    form.formState.errors.confirmPassword && "border-red-500"
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
