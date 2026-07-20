"use client";

import { UserRound, Bell, Store, LucideIcon } from "lucide-react";

import { StaggerChildren } from "@/components/ui/stagger-children";

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: UserRound,
    title: "Personaliziraj profil",
    text: "Postavi svoje ime i avatar da aplikacija bude tvoja.",
  },
  {
    icon: Store,
    title: "Tvoje trgovine",
    text: "Odaberi trgovine i lokacije za usporedbe cijena po tvom džepu.",
  },
  {
    icon: Bell,
    title: "Obavijesti - bez spama",
    text: "Odaberi kako, o čemu, i kada želiš dobiti obavijesti o akcijama i novostima.",
  },
];

export default function WelcomeStep() {
  return (
    <div className="space-y-6 py-2">
      <p className="text-sm text-muted-foreground text-pretty">
        Provedimo te kroz nekoliko kratkih koraka da Disscount prilagodimo tebi.
        Sve možeš kasnije urediti u postavkama.
      </p>

      <StaggerChildren className="space-y-5">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-6" />
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
