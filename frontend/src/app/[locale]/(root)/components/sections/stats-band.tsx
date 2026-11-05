import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import SparkleField from "@/app/[locale]/(root)/components/doodles/sparkle-field";
import { statIds } from "@/app/[locale]/(root)/data/landing";

const bandPalette = [
  "text-primary-foreground/60",
  "text-primary-foreground/40",
  "text-primary-foreground/25",
];

export default function StatsBand() {
  const t = useTranslations("landing");

  return (
    <section className="relative">
      <h2 className="sr-only">{t("stats.heading")}</h2>

      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-4 sm:py-8 shadow-lg">
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
          {statIds.map((id) => (
            <div key={id} className="space-y-1 py-4 sm:px-6">
              <div className="text-4xl sm:text-5xl font-saira-stencil-semibold text-pretty">
                {t(`stats.${id}.value`)}
              </div>
              <p className="text-sm uppercase tracking-wider text-primary-foreground/85 text-pretty">
                {t(`stats.${id}.label`)}
              </p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
