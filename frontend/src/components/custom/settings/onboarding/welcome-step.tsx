"use client";

import { PiggyBank, Bell, Store, LucideIcon } from "lucide-react";

import { StaggerChildren } from "@/components/ui/stagger-children";

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Store,
    title: "Tvoje trgovine",
    text: "Odaberi trgovine i lokacije za usporedbe cijena po tvom džepu.",
  },
  {
    icon: Bell,
    title: "Obavijesti o akcijama",
    text: "Prati proizvode i saznaj čim padnu ispod tvog praga.",
  },
  {
    icon: PiggyBank,
    title: "Pametna štednja",
    text: "Popisi za kupnju ti odmah pokažu gdje je ukupno najjeftinije.",
  },
];

export function WelcomeStep() {
  return (
    <div className="space-y-6 py-2">
      <p className="text-sm text-muted-foreground text-pretty">
        Provedimo te kroz nekoliko kratkih koraka da Disscount prilagodimo
        tebi. Svaki korak možeš preskočiti i kasnije urediti u postavkama.
      </p>

      <StaggerChildren className="space-y-4">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </StaggerChildren>
    </div>
  );
}
