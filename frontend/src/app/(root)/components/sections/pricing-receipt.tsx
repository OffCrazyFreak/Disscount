import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import EdgeFade from "@/components/custom/common/edge-fade";
import type { IPricingRow } from "@/app/(root)/components/data/landing";

interface IPricingReceiptProps {
  name: string;
  subtitle: string;
  rows: IPricingRow[];
  price: string;
  total: string;
  disabled?: boolean;
  badge?: ReactNode;
}

// Torn-bottom receipt with a bottom edge fade. Free and premium plans render
// this identically, differing only in copy, the badge and the disabled look.
const receiptClip =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

function ReceiptRow({ label, price }: { label: string; price: string }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span>{label}</span>
      <span className="flex-1 border-b border-dotted border-muted-foreground/40" />
      <span className="font-mono">{price}</span>
    </li>
  );
}

export default function PricingReceipt({
  name,
  subtitle,
  rows,
  price,
  total,
  disabled = false,
  badge,
}: IPricingReceiptProps) {
  return (
    <div className="relative drop-shadow-[0_3px_2px_rgba(0,0,0,0.18)]">
      <div
        className={cn(
          "relative rounded-t-2xl border p-6",
          receiptClip,
          disabled ? "bg-muted border-dashed text-muted-foreground" : "bg-card",
        )}
      >
        <div className="text-center space-y-1 pb-4 border-b border-dashed">
          <h3 className="font-saira-stencil-semibold text-2xl text-primary">
            {name}
          </h3>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <ul className="py-4 space-y-2.5">
          {rows.map((row) => (
            <ReceiptRow key={row.label} label={row.label} price={price} />
          ))}
        </ul>

        <div className="pt-3 pb-6 border-t border-dashed flex items-baseline gap-2 font-semibold">
          <span>UKUPNO</span>
          <span className="flex-1 border-b border-dotted border-muted-foreground/40" />
          <span className="font-mono">{total}</span>
        </div>

        <EdgeFade
          className={cn("absolute h-14", disabled ? "from-muted" : "from-card")}
        />
      </div>

      {badge}
    </div>
  );
}
