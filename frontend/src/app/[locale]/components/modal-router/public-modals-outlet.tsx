"use client";

import { useState } from "react";

import ResetPasswordModal from "@/components/custom/auth/reset-password-modal";
import AuthStatusModal from "@/components/custom/auth/auth-status-modal";
import ContactModal from "@/components/custom/contact/contact-modal";
import DonationModal from "@/components/custom/donation/donation-modal";
import LimitReachedDialog from "@/components/custom/limit-reached/limit-reached-dialog";
import type { ModalTarget } from "@/lib/modal/modal-registry";
import { useUser } from "@/context/user-context";

interface IPublicModalsOutletProps {
  target: ModalTarget | null;
}

export default function PublicModalsOutlet({
  target,
}: IPublicModalsOutletProps) {
  const name = target?.name;
  const { user } = useUser();
  // Held after close, not on a timer, so the exit animation never flips to the success copy.
  const [linkError, setLinkError] = useState<string>();
  if (name === "email-verified" || name === "email-changed") {
    const nextLinkError = "linkError" in target ? target.linkError : undefined;
    if (nextLinkError !== linkError) setLinkError(nextLinkError);
  }

  return (
    <>
      <ResetPasswordModal open={name === "reset-password"} />
      <AuthStatusModal
        open={name === "email-verified"}
        kind="email-verified"
        linkError={linkError}
      />
      <AuthStatusModal
        open={name === "email-changed"}
        kind="email-changed"
        linkError={linkError}
      />

      {/* Keyed by account: it stays mounted across sign-ins, and its form holds what was typed. */}
      <ContactModal key={user?.id} open={name === "contact"} />
      <DonationModal open={name === "donate"} />

      {/* Opened by the query client, not the URL, since any create anywhere can hit a cap. */}
      <LimitReachedDialog />
    </>
  );
}
