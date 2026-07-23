"use client";

import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { resetAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import type { CredentialsFormValues } from "@/components/custom/settings/security/credentials-schema";

interface IUseCredentialsSubmitProps {
  hasPassword: boolean;
  currentEmail: string;
  form: UseFormReturn<CredentialsFormValues>;
  onChanged: () => void;
}

export function useCredentialsSubmit({
  hasPassword,
  currentEmail,
  form,
  onChanged,
}: IUseCredentialsSubmitProps) {
  const { refreshUser } = useUser();

  async function setInitialPassword(data: CredentialsFormValues) {
    const response = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: data.newPassword }),
    });

    if (!response.ok) {
      form.setError("newPassword", {
        message: "Greška pri postavljanju lozinke.",
      });
      return;
    }

    resetAuthToken();
    await refreshUser();
    onChanged();
    form.resetField("newPassword");
    toast.success("Lozinka je postavljena! Sada se možeš prijaviti i emailom.");
  }

  async function updateCredentials(data: CredentialsFormValues) {
    const emailChanged = data.email !== currentEmail;
    const wantPasswordChange = data.newPassword.length > 0;

    if (!emailChanged && !wantPasswordChange) {
      toast.info("Nema promjena za spremiti.");
      return;
    }

    if (wantPasswordChange) {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        form.setError("currentPassword", {
          message:
            error.status === 400
              ? "Trenutna lozinka nije točna."
              : (error.message ?? "Greška pri promjeni lozinke."),
        });
        return;
      }
    }

    if (emailChanged) {
      if (!wantPasswordChange) {
        const { error: passwordError } = await authClient.signIn.email({
          email: currentEmail,
          password: data.currentPassword,
        });

        if (passwordError) {
          form.setError("currentPassword", {
            message: "Trenutna lozinka nije točna.",
          });
          return;
        }
      }

      // Guarded endpoint that enforces "no social linked" server-side.
      const response = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: data.email }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        form.setError("email", {
          message:
            body.error === "social_linked"
              ? "Za promjenu emaila prvo odspoji povezane račune (Google, Facebook)."
              : "Greška pri promjeni emaila.",
        });

        // Password already committed above; confirm it and clear its fields so a retry only re-does email.
        if (wantPasswordChange) {
          resetAuthToken();
          await refreshUser();
          form.resetField("newPassword");
          form.resetField("currentPassword");
          toast.success("Lozinka je promijenjena.");
        }
        return;
      }
    }

    resetAuthToken();
    await refreshUser();
    form.resetField("newPassword");
    form.resetField("currentPassword");

    if (emailChanged) {
      // The new email applies only once the confirmation link is clicked.
      form.resetField("email", { defaultValue: currentEmail });
      toast.success(
        wantPasswordChange
          ? "Lozinka je promijenjena. Za promjenu emaila potvrdi poveznicu poslanu na tvoju trenutnu adresu."
          : "Poslali smo poveznicu za potvrdu na tvoju trenutnu email adresu. Promjena emaila primijenit će se nakon potvrde.",
      );
    } else {
      toast.success("Lozinka je promijenjena.");
    }
  }

  async function submit(data: CredentialsFormValues) {
    try {
      if (hasPassword) {
        await updateCredentials(data);
      } else {
        await setInitialPassword(data);
      }
    } catch {
      form.setError("root", {
        message: "Nešto je pošlo po krivu. Pokušaj ponovo.",
      });
    }
  }

  return { submit };
}
