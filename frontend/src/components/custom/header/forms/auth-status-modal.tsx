"use client";

import { CircleCheck } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";

type StatusKind = "email-verified" | "email-changed";

const STATUS_COPY: Record<StatusKind, { title: string; description: string }> = {
  "email-verified": {
    title: "Email potvrđen",
    description: "Tvoja email adresa je potvrđena. Dobrodošao u Disscount!",
  },
  "email-changed": {
    title: "Email promijenjen",
    description: "Tvoja nova email adresa je potvrđena i sada je aktivna.",
  },
};

// Shown after the user returns from a verification / email-change link
// (?modal=email-verified | email-changed). Better Auth signs them in on the way
// back, so this is just a friendly confirmation with a single continue action.
export function AuthStatusModal({
  open,
  kind,
}: {
  open: boolean;
  kind: StatusKind;
}) {
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
