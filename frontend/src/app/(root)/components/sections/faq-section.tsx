import { Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import SquiggleUnderline from "@/app/(root)/components/doodles/squiggle-underline";
import { faqItems } from "@/app/(root)/components/data/faq";

export default function FaqSection() {
  return (
    <section>
      <SectionHeading
        title="Česta pitanja"
        subtitle="Sve što te zanima prije prve kupnje s Disscountom."
      />

      <ScrollReveal
        preset="rise"
        stagger={0.08}
        amount={0.2}
        className="max-w-2xl mx-auto space-y-3"
      >
        {faqItems.map((item) => (
          <details
            key={item.question}
            name="landing-faq"
            className="faq-item group bg-card border rounded-2xl shadow-sm open:border-primary/40 open:shadow-md"
          >
            <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="font-semibold text-base">
                <span className="relative">
                  {item.question}
                  <SquiggleUnderline className="absolute -bottom-1.5 left-0 w-full h-2 text-primary hidden group-open:block" />
                </span>
              </h3>

              <span className="faq-icon">
                <Plus className="size-5 shrink-0 text-primary" />
              </span>
            </summary>

            <p className="px-5 pb-5 text-sm text-muted-foreground text-pretty">
              {item.answer}
            </p>
          </details>
        ))}
      </ScrollReveal>
    </section>
  );
}
