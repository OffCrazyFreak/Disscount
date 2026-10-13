"use client";

import { CreditCard, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export default function DigitalCardsEmpty() {
  return (
    <div className="py-12 text-center">
      <CreditCard
        aria-hidden="true"
        className="mx-auto mb-4 size-12 text-gray-400"
      />

      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Još nemaš kartica
      </h3>

      <p className="mb-6 text-gray-600">
        Dodaj prvu karticu trgovine i na blagajni umjesto plastike pokaži
        mobitel.
      </p>

      <Button
        effect="shineHover"
        icon={Plus}
        iconPlacement="left"
        onClick={() => openModalUrl({ name: "digital-card", action: "new" })}
      >
        Dodaj karticu
      </Button>
    </div>
  );
}
