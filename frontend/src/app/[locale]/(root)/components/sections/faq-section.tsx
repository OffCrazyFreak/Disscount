import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import SectionHeading from "@/app/[locale]/(root)/components/sections/section-heading";
import SquiggleUnderline from "@/app/[locale]/(root)/components/doodles/squiggle-underline";
import { faqIds } from "@/app/[locale]/(root)/data/faq";

export default function FaqSection() {
  const t = useTranslations("landing");

  return (
    <section id="faq" className="scroll-mt-24">
      <SectionHeading title={t("faq.title")} subtitle={t("faq.subtitle")} />

      <ScrollReveal
        preset="rise"
        stagger={0.08}
        amount={0.2}
        className="max-w-2xl mx-auto space-y-3"
      >
        {faqIds.map((id) => (
          <details
            key={id}
            name="landing-faq"
            className="faq-item group bg-card border rounded-2xl shadow-sm open:border-primary/40 open:shadow-md"
          >
            <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="font-semibold text-base text-pretty">
                <span className="relative">
                  {t(`faq.items.${id}.question`)}
                  <SquiggleUnderline className="absolute -bottom-1.5 left-0 w-full h-2 text-primary hidden group-open:block" />
                </span>
              </h3>

              <span className="faq-icon">
                <Plus className="size-5 shrink-0 text-primary" />
              </span>
            </summary>

            <p className="px-5 pb-5 text-sm text-muted-foreground text-pretty">
              {t(`faq.items.${id}.answer`)}
            </p>
          </details>
        ))}
      </ScrollReveal>
    </section>
  );
}
