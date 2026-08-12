"use client";

import { CreditCard } from "lucide-react";

import CreateDigitalCardButton from "@/app/(user)/digital-cards/components/create-digital-card-button";

export default function DigitalCardsEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <CreditCard aria-hidden="true" className="size-10 text-primary" />

      <h3 className="text-lg font-semibold">Još nemaš spremljenih kartica</h3>

      <p className="max-w-sm text-sm text-muted-foreground">
        Spremi kartice vjernosti koje već koristiš i imaj ih na blagajni bez
        vađenja novčanika. Rade i bez interneta.
      </p>

      <CreateDigitalCardButton />
    </div>
  );
}
