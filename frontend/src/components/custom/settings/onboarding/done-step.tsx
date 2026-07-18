"use client";

import { CircleCheck } from "lucide-react";

export function DoneStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CircleCheck className="size-7" />
      </div>

      <div className="space-y-1">
        <p className="font-medium">Disscount je spreman za tebe.</p>
        <p className="text-sm text-muted-foreground text-pretty">
          Klikom na Završi spremamo tvoje odabire. Sve možeš kasnije
          promijeniti u postavkama računa.
        </p>
      </div>
    </div>
  );
}
