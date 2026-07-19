import { Landmark, Database } from "lucide-react";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const pillars = [
  {
    icon: Landmark,
    title: "Javno objavljene cijene",
    description:
      "Od 15. svibnja 2025. trgovački lanci u Hrvatskoj zakonski su obvezni javno objavljivati cijene proizvoda. Disscount te službene podatke pretvara u jasne usporedbe.",
  },
  {
    icon: Database,
    title: "Otvoreni izvor podataka",
    description:
      "Cijene dolaze iz otvorenog projekta Cijene API, koji svakodnevno prikuplja službene cjenike trgovačkih lanaca - bez ručnog prepisivanja i bez skrivenih dogovora s trgovinama.",
  },
];

export default function TrustSection() {
  return (
    <section>
      <SectionHeading
        title="Podaci kojima možeš vjerovati"
        subtitle="Bez izmišljenih popusta i sponzoriranih rezultata - samo službene, javno dostupne cijene."
      />

      <ScrollReveal
        preset="rise"
        stagger={0.15}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
      >
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="bg-card border rounded-3xl p-6 space-y-3 shadow-sm"
          >
            <div className="size-11 grid place-items-center rounded-xl bg-primary/10 text-primary">
              <pillar.icon className="size-6" />
            </div>

            <h3 className="font-semibold">{pillar.title}</h3>

            <p className="text-sm text-muted-foreground text-pretty">
              {pillar.description}
            </p>
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
