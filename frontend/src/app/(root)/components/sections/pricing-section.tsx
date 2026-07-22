import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import PricingReceipt from "@/app/(root)/components/sections/pricing-receipt";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { freePlanRows, proPlanRows } from "@/app/(root)/data/landing";

export default function PricingSection() {
  return (
    <section>
      <SectionHeading
        title="Koliko košta? Ništa."
        subtitle="Disscount je besplatan i takav ostaje. Račun ti ovaj put ide u korist."
      />

      <ScrollReveal
        preset="swing"
        stagger={0.15}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start"
      >
        <PricingReceipt
          name="disscount"
          subtitle="Račun · besplatni plan"
          rows={freePlanRows}
          price="0,00"
          total="0,00 EUR"
        />

        <PricingReceipt
          name="disscount premium"
          subtitle="Račun · premium plan"
          rows={proPlanRows}
          price="?"
          total="?"
          disabled
          badge={
            <ComingSoonBadge className="absolute -top-2.5 right-4 rotate-6" />
          }
        />
      </ScrollReveal>
    </section>
  );
}
