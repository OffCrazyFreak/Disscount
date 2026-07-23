"use client";

import { CircleCheck } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";

type StatusKind = "email-verified" | "email-changed";

const STATUS_COPY: Record<StatusKind, { title: string; description: string }> =
  {
    "email-verified": {
      title: "Email potvrđen",
      description: "Tvoja email adresa je potvrđena. Drago nam je što si tu!",
    },
    "email-changed": {
      title: "Email promijenjen",
      description: "Tvoja nova email adresa je potvrđena i sada je aktivna.",
    },
  };

interface IAuthStatusModalProps {
  open: boolean;
  kind: StatusKind;
}

// Better Auth already signed them in on the way back, so this only confirms.
export default function AuthStatusModal({ open, kind }: IAuthStatusModalProps) {
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
      title={copy.title}
      description={copy.description}
      hero={
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-6" />
        </div>
      }
      submitLabel="Nastavi"
      submitIcon={CircleCheck}
      onSubmit={handleContinue}
    />
  );
}
