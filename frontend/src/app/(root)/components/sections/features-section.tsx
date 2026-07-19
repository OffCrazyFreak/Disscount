import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import FeatureCard from "@/app/(root)/components/sections/feature-card";
import { featureItems } from "@/app/(root)/components/data/features";

export default function FeaturesSection() {
  return (
    <section>
      <SectionHeading
        title="Sve za pametnu kupovinu"
        subtitle="Ono što radi već danas - i ono što uskoro stiže. Značajke s naljepnicom USKORO su u izradi."
      />

      <ScrollReveal
        preset="rise"
        stagger={0.06}
        amount={0.15}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {featureItems.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </ScrollReveal>
    </section>
  );
}
