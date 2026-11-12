import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import SectionHeading from "@/app/[locale]/(root)/components/sections/section-heading";
import FeatureCard from "@/app/[locale]/(root)/components/sections/feature-card";
import { featureItems } from "@/app/[locale]/(root)/data/features";

export default function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section>
      <SectionHeading
        title={t("features.title")}
        subtitle={t("features.subtitle")}
      />

      <ScrollReveal
        preset="rise"
        stagger={0.06}
        amount={0.15}
        className="flex flex-wrap justify-center gap-5 [&>*]:w-full sm:[&>*]:w-[calc(50%-10px)] lg:[&>*]:w-[calc(33.333%-14px)]"
      >
        {featureItems.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </ScrollReveal>
    </section>
  );
}
