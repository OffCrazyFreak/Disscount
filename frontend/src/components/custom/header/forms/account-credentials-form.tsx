"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { passwordSchema } from "@/lib/api/schemas/auth-user";
import { authClient } from "@/lib/auth-client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";

interface IAccountCredentialsFormProps {
  hasPassword: boolean;
  onChanged: () => void;
}

interface FieldErrors {
  email?: string;
  newPassword?: string;
  currentPassword?: string;
}

export default function AccountCredentialsForm({
  hasPassword,
  onChanged,
}: IAccountCredentialsFormProps) {
  const { user, refreshUser } = useUser();
  const currentEmail = user?.email ?? "";

  const [email, setEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail]);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (hasPassword && email !== currentEmail) {
      if (!z.email().safeParse(email).success) {
        next.email = "Unesi važeći email";
      }
    }

    // Social accounts must set a password; password accounts may leave it blank.
    if (!hasPassword || newPassword.length > 0) {
      const result = passwordSchema.safeParse(newPassword);
      if (!result.success) {
        next.newPassword = result.error.issues[0].message;
      }
    }

    if (hasPassword && !currentPassword) {
      next.currentPassword = "Unesi trenutnu lozinku";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSetPassword() {
    const response = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      setErrors({ newPassword: "Greška pri postavljanju lozinke." });
      return;
    }

    resetAuthToken();
    await refreshUser();
    onChanged();
    setNewPassword("");
    toast.success("Lozinka je postavljena! Sada se možeš prijaviti i emailom.");
  }

  async function handleUpdateCredentials() {
    const emailChanged = email !== currentEmail;
    const wantPasswordChange = newPassword.length > 0;

    if (!emailChanged && !wantPasswordChange) {
      toast.info("Nema promjena za spremiti.");
      return;
    }

    if (wantPasswordChange) {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setErrors({
          currentPassword:
            error.status === 400
              ? "Trenutna lozinka nije točna."
              : error.message ?? "Greška pri promjeni lozinke.",
        });
        return;
      }
    }

    if (emailChanged) {
      if (!wantPasswordChange) {
        const { error: passwordError } = await authClient.signIn.email({
          email: currentEmail,
          password: currentPassword,
        });

        if (passwordError) {
          setErrors({ currentPassword: "Trenutna lozinka nije točna." });
          return;
        }
      }

      const { error } = await authClient.changeEmail({ newEmail: email });

      if (error) {
        setErrors({ email: error.message ?? "Greška pri promjeni emaila." });
        return;
      }
    }

    resetAuthToken();
    await refreshUser();
    setNewPassword("");
    setCurrentPassword("");
    toast.success("Promjene su spremljene!");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (hasPassword) {
        await handleUpdateCredentials();
      } else {
        await handleSetPassword();
      }
    } catch {
      setSubmitError("Nešto je pošlo po krivu. Pokušaj ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const saveDisabled =
    isSubmitting ||
    (hasPassword ? currentPassword.trim() === "" : newPassword.trim() === "");

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="account-email">Email</Label>
        <Input
          id="account-email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={!hasPassword}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
        />
        {!hasPassword && (
          <p className="text-xs text-muted-foreground">
            Postavi lozinku da bi mogao promijeniti email.
          </p>
        )}
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="account-new-password">
          {hasPassword ? "Nova lozinka" : "Lozinka"}
        </Label>
        <PasswordInput
          id="account-new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors((prev) => ({ ...prev, newPassword: undefined }));
          }}
        />
        {hasPassword && (
          <p className="text-xs text-muted-foreground">
            Ostavi prazno ako ne mijenjaš lozinku.
          </p>
        )}
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword}</p>
        )}
      </div>

      {hasPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="account-current-password">Trenutna lozinka</Label>
          <PasswordInput
            id="account-current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setErrors((prev) => ({ ...prev, currentPassword: undefined }));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Potrebna za promjenu emaila ili lozinke.
          </p>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>
      )}

      {submitError && (
        <p className="text-xs text-destructive">{submitError}</p>
      )}

      <Button
        type="submit"
        icon={Save}
        iconPlacement="left"
        disabled={saveDisabled}
        className="w-full"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Spremi"}
      </Button>
    </form>
  );
}
