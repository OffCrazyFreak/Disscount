import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import TextGlow from "@/components/custom/common/text-glow";
import PriceLineDoodle from "@/app/[locale]/(root)/components/doodles/price-line-doodle";

const checkIds = ["chart", "realDiscount", "average"] as const;

export default function PriceHistorySection() {
  const t = useTranslations("landing");

  return (
    <section>
      <ScrollReveal
        preset="rise"
        className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative isolate space-y-5">
          <TextGlow className="-inset-8" />

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-pretty">
            {t("priceHistory.title")}
          </h2>

          <p className="text-muted-foreground text-pretty">
            {t("priceHistory.description")}
          </p>

          <ul className="space-y-2.5">
            {checkIds.map((id) => (
              <li
                key={id}
                className="flex items-start gap-2.5 text-sm text-pretty"
              >
                <Check
                  aria-hidden="true"
                  className="size-4 mt-0.5 shrink-0 text-primary"
                />
                {t(`priceHistory.checks.${id}`)}
              </li>
            ))}
          </ul>

          <Button asChild variant="primary">
            <Link href="/products">{t("priceHistory.cta")}</Link>
          </Button>
        </div>

        <div className="relative bg-card border rounded-3xl p-8 shadow-sm hidden sm:block">
          <PriceLineDoodle className="w-full h-auto text-primary" />
          <p className="mt-4 text-center text-xs uppercase tracking-wider text-muted-foreground text-pretty">
            {t("priceHistory.chartCaption")}
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
