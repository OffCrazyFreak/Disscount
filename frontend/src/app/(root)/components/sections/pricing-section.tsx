import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import ReceiptDoodle from "@/app/(root)/components/doodles/receipt-doodle";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  freePlanRows,
  proPlanRows,
} from "@/app/(root)/components/data/landing";
import type { IPricingRow } from "@/app/(root)/components/data/landing";

function ReceiptRow({ row, price }: { row: IPricingRow; price: string }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span>{row.label}</span>
      <span className="flex-1 border-b border-dotted border-muted-foreground/40" />
      <span className="font-mono">{price}</span>
    </li>
  );
}

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
        <div className="relative bg-card border rounded-t-2xl p-6 shadow-md [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]">
        <div className="text-center space-y-1 pb-4 border-b border-dashed">
            <h3 className="font-saira-stencil-semibold text-2xl text-primary">
              disscount
            </h3>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Račun · besplatni plan
            </p>
          </div>

          <ul className="py-4 space-y-2.5">
            {freePlanRows.map((row) => (
              <ReceiptRow key={row.label} row={row} price="0,00" />
            ))}
          </ul>

          <div className="pt-3 pb-6 border-t border-dashed flex items-baseline gap-2 font-semibold">
            <span>UKUPNO</span>
            <span className="flex-1 border-b border-dotted border-muted-foreground/40" />
            <span className="font-mono">0,00 EUR</span>
          </div>
        </div>

        <div className="relative bg-muted/50 border border-dashed rounded-2xl p-6 pb-14 space-y-4">
          <ComingSoonBadge className="absolute -top-2.5 right-4 rotate-6" />
          <ReceiptDoodle className="absolute bottom-2 right-5 w-10 rotate-6 text-muted-foreground/30" />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Disscount Pro</h3>
            <p className="text-sm text-muted-foreground">
              Za one koji žele još više uštede - jednog dana.
            </p>
          </div>

          <ul className="space-y-2.5">
            {proPlanRows.map((row) => (
              <ReceiptRow key={row.label} row={row} price="?" />
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            Sve osnovne značajke ostaju besplatne i kad Pro stigne.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
