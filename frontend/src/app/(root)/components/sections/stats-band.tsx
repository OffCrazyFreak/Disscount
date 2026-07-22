import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SparkleField from "@/app/(root)/components/doodles/sparkle-field";
import { statItems } from "@/app/(root)/components/data/landing";

const bandPalette = [
  "text-primary-foreground/60",
  "text-primary-foreground/40",
  "text-primary-foreground/25",
];

export default function StatsBand() {
  return (
    <section className="relative">
      <h2 className="sr-only">Disscount u brojkama</h2>

      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-10 sm:py-12 shadow-lg">
        <SparkleField
          count={6}
          seed="stats-sparkles"
          palette={bandPalette}
          className="absolute inset-0"
        />

        <ScrollReveal
          preset="pop"
          className="grid grid-cols-1 sm:grid-cols-3 text-center divide-y-2 divide-dashed divide-primary-foreground/40 sm:divide-y-0 sm:divide-x-2"
        >
          {statItems.map((stat) => (
            <div key={stat.label} className="space-y-1 py-7 sm:px-6">
              <div className="text-4xl sm:text-5xl font-saira-stencil-semibold text-pretty">
                {stat.value}
              </div>
              <p className="text-sm uppercase tracking-wider text-primary-foreground/85 text-pretty">
                {stat.label}
              </p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
