"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";

type StatusKind = "email-verified" | "email-changed";

const STATUS_COPY = {
  "email-verified": {
    title: "statusModal.emailVerified.title",
    description: "statusModal.emailVerified.description",
  },
  "email-changed": {
    title: "statusModal.emailChanged.title",
    description: "statusModal.emailChanged.description",
  },
} as const satisfies Record<StatusKind, { title: string; description: string }>;

interface IAuthStatusModalProps {
  open: boolean;
  kind: StatusKind;
}

// Reached via ?modal=email-verified|email-changed after the redirect; Better Auth
// already signed them in on the way back, so this only confirms.
export default function AuthStatusModal({ open, kind }: IAuthStatusModalProps) {
  const t = useTranslations("auth");
  const { refreshUser } = useUser();
  const copy = STATUS_COPY[kind];

  function handleContinue() {
    // Pull the freshly verified/updated identity before closing.
    void refreshUser();
    closeModalUrl();
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleContinue()}
      size="sm"
      centered
      title={t(copy.title)}
      description={t(copy.description)}
      hero={
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-6" />
        </div>
      }
      submitLabel={t("statusModal.continue")}
      submitIcon={CircleCheck}
      onSubmit={handleContinue}
    />
  );
}
