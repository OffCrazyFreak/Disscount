"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import {
  loginSchema,
  signUpSchema,
  LoginForm,
  SignUpForm,
} from "@/lib/auth-schemas";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup";

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginRootError, setLoginRootError] = useState<string | null>(null);
  const { login, register } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      await login(data.usernameOrEmail, data.password);
    },
    onSuccess: () => {
      toast.success("Prijava uspješna!");
      onOpenChange(false);
      loginForm.reset();
      setLoginRootError(null);
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
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpForm) => {
      await register("TEST_USERNAME", data.email, data.password);
    },
    onSuccess: () => {
      toast.success("Uspješno ste se registrirali!");
      onOpenChange(false);
      signUpForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Greška pri registraciji");
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    // clear previous root error and start login
    setLoginRootError(null);
    loginMutation.mutate(data);
  };

  const onSignUpSubmit = (data: SignUpForm) => {
    signUpMutation.mutate(data);
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth flow
    toast.info("Google prijava će biti dodana uskoro");
  };

  const isLoading = loginMutation.isPending || signUpMutation.isPending;

  const switchToSignUp = () => {
    setAuthMode("signup");
    loginForm.reset();
    setLoginRootError(null);
  };

  const switchToLogin = () => {
    setAuthMode("login");
    signUpForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {authMode === "login" ? "Prijava" : "Registracija"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {authMode === "login" ? (
            <>
              {loginRootError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
                  {loginRootError}
                </div>
              )}
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="grid gap-4"
              >
                <div className="grid gap-2">
                  <Label htmlFor="usernameOrEmail">
                    Korisničko ime ili email
                  </Label>
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="korisnik@example.com"
                    {...loginForm.register("usernameOrEmail")}
                    className={cn(
                      loginForm.formState.errors.usernameOrEmail &&
                        "border-red-500"
                    )}
                  />
                  {loginForm.formState.errors.usernameOrEmail && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.usernameOrEmail.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Lozinka</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="************"
                    {...loginForm.register("password")}
                    className={cn(
                      loginForm.formState.errors.password && "border-red-500"
                    )}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {loginMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Prijavi se"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <form
              onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="korisnik@example.com"
                  {...signUpForm.register("email")}
                  className={cn(
                    signUpForm.formState.errors.email && "border-red-500"
                  )}
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="signup-password">Lozinka</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="********"
                  {...signUpForm.register("password")}
                  className={cn(
                    signUpForm.formState.errors.password && "border-red-500"
                  )}
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...signUpForm.register("confirmPassword")}
                  className={cn(
                    signUpForm.formState.errors.confirmPassword &&
                      "border-red-500"
                  )}
                />
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {signUpMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Registriraj se"
                )}
              </Button>
            </form>
          )}

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">
                ili
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="0.98em"
              height="1em"
              viewBox="0 0 256 262"
            >
              <path
                fill="#4285F4"
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              ></path>
              <path
                fill="#34A853"
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              ></path>
              <path
                fill="#FBBC05"
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
              ></path>
              <path
                fill="#EB4335"
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              ></path>
            </svg>
            Prijavi se preko Googlea
          </Button>

          <div className="flex justify-center pt-4">
            <p className="text-center text-xs text-muted-foreground">
              {authMode === "login" ? (
                <>
                  Još nemaš račun?{" "}
                  <button
                    type="button"
                    onClick={switchToSignUp}
                    className="cursor-pointer underline text-primary hover:text-primary/80"
                    disabled={isLoading}
                  >
                    Registriraj se
                  </button>
                </>
              ) : (
                <>
                  Već imaš račun?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="cursor-pointer underline text-primary hover:text-primary/80"
                    disabled={isLoading}
                  >
                    Prijavi se
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
