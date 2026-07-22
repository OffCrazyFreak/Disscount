import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import FeatureCard from "@/app/(root)/components/sections/feature-card";
import { featureItems } from "@/app/(root)/components/data/features";

export default function FeaturesSection() {
  return (
    <section>
      <SectionHeading
        title="Sve za pametnu kupovinu"
        subtitle="Ono što radi već danas - i ono što uskoro stiže."
      />

      <ScrollReveal
        preset="rise"
        stagger={0.06}
        amount={0.15}
        className="flex flex-wrap justify-center gap-5 [&>*]:w-full sm:[&>*]:w-[calc(50%-10px)] lg:[&>*]:w-[calc(33.333%-14px)]"
      >
        {featureItems.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </ScrollReveal>
    </section>
  );
}
