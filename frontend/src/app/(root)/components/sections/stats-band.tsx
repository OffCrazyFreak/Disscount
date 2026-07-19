import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SparkleDoodle from "@/app/(root)/components/doodles/sparkle-doodle";
import { statItems } from "@/app/(root)/components/data/landing";

export default function StatsBand() {
  return (
    <section className="relative">
      <h2 className="sr-only">Disscount u brojkama</h2>

      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-10 sm:py-12 shadow-lg">
        <SparkleDoodle className="absolute top-4 left-6 w-5 text-primary-foreground/60" />
        <SparkleDoodle
          className="absolute bottom-5 right-8 w-7 text-primary-foreground/50"
          delay={1.1}
        />

        <ScrollReveal
          preset="pop"
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          {statItems.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="text-4xl sm:text-5xl font-saira-stencil-semibold">
                {stat.value}
              </div>
              <p className="text-sm uppercase tracking-wider text-primary-foreground/85">
                {stat.label}
              </p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
