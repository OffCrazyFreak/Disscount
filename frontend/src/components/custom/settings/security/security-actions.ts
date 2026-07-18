"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { userService } from "@/lib/api";
import { useUser } from "@/context/user-context";

// Account-level security actions that live outside the credentials form:
// signing out other devices and deleting the account (with full session cleanup).
export function useSecurityActions() {
  const router = useRouter();
  const { logout } = useUser();
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function revokeOtherSessions() {
    setRevoking(true);
    const { error } = await authClient.revokeOtherSessions();
    setRevoking(false);

    if (error) {
      toast.error("Greška pri odjavi ostalih uređaja.");
      return;
    }
    toast.success("Odjavljeni su svi ostali uređaji.");
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message ?? "delete failed");

      // Remove the backend profile, then clear session/token/offline cache.
      await userService.deleteCurrentUser();
      await logout();
      router.replace("/");
      toast.success("Tvoj račun je obrisan.");
    } catch {
      toast.error("Greška pri brisanju računa. Pokušaj ponovo.");
    } finally {
      setDeleting(false);
    }
  }

  return { revokeOtherSessions, deleteAccount, revoking, deleting };
}
