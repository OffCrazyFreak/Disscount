import { useTranslations } from "next-intl";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import SectionHeading from "@/app/[locale]/(root)/components/sections/section-heading";
import PricingReceipt from "@/app/[locale]/(root)/components/sections/pricing-receipt";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import {
  freePlanRowIds,
  proPlanRowIds,
} from "@/app/[locale]/(root)/data/landing";

export default function PricingSection() {
  const t = useTranslations("landing");

  return (
    <section>
      <SectionHeading
        title={t("pricing.title")}
        subtitle={t("pricing.subtitle")}
      />

      <ScrollReveal
        preset="swing"
        stagger={0.15}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start"
      >
        <PricingReceipt
          name="disscount"
          subtitle={t("pricing.freeSubtitle")}
          rows={freePlanRowIds.map((id) => t(`pricing.freeRows.${id}`))}
          price={t("pricing.freePrice")}
          total={t("pricing.freeTotal")}
        />

        <PricingReceipt
          name="disscount premium"
          subtitle={t("pricing.premiumSubtitle")}
          rows={proPlanRowIds.map((id) => t(`pricing.premiumRows.${id}`))}
          price={t("pricing.unknownPrice")}
          total={t("pricing.unknownPrice")}
          disabled
          badge={
            <ComingSoonBadge className="absolute -top-2.5 right-4 rotate-6" />
          }
        />
      </ScrollReveal>
    </section>
  );
}
