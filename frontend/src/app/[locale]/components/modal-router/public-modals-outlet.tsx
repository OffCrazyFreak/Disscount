"use client";

import ResetPasswordModal from "@/components/custom/auth/reset-password-modal";
import AuthStatusModal from "@/components/custom/auth/auth-status-modal";
import ContactModal from "@/components/custom/contact/contact-modal";
import DonationModal from "@/components/custom/donation/donation-modal";
import type { ModalTarget } from "@/lib/modal/modal-registry";

interface IPublicModalsOutletProps {
  target: ModalTarget | null;
}

/** Modals opened from email links or the footer, reachable without an account. */
export default function PublicModalsOutlet({
  target,
}: IPublicModalsOutletProps) {
  const name = target?.name;

  return (
    <>
      <ResetPasswordModal open={name === "reset-password"} />
      <AuthStatusModal open={name === "email-verified"} kind="email-verified" />
      <AuthStatusModal open={name === "email-changed"} kind="email-changed" />

      <ContactModal open={name === "contact"} />
      <DonationModal open={name === "donate"} />
    </>
  );
}
