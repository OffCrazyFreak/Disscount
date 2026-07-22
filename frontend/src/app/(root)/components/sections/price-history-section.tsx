import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import TextGlow from "@/components/custom/common/text-glow";
import PriceLineDoodle from "@/app/(root)/components/doodles/price-line-doodle";

const checks: string[] = [
  "Graf cijene za svaki proizvod, po trgovini",
  "Odmah vidiš je li popust stvaran ili napuhan",
  "Usporedba s prosječnom cijenom u drugim lancima",
];

export default function PriceHistorySection() {
  return (
    <section>
      <ScrollReveal
        preset="rise"
        className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative isolate space-y-5">
          <TextGlow className="-inset-8" />

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-pretty">
            Je li akcija stvarno akcija?
          </h2>

          <p className="text-muted-foreground text-pretty">
            Neke &quot;akcije&quot; samo vrate cijenu na staru. Disscount pamti
            povijest cijena pa točno vidiš koliko je proizvod koštao prošli
            tjedan, prošli mjesec - i isplati li se čekati.
          </p>

          <ul className="space-y-2.5">
            {checks.map((check) => (
              <li
                key={check}
                className="flex items-start gap-2.5 text-sm text-pretty"
              >
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                {check}
              </li>
            ))}
          </ul>

          <Button asChild variant="primary">
            <Link href="/products">Provjeri svoj proizvod</Link>
          </Button>
        </div>

        <div className="relative bg-card border rounded-3xl p-8 shadow-sm">
          <PriceLineDoodle className="w-full h-auto text-primary" />
          <p className="mt-4 text-center text-xs uppercase tracking-wider text-muted-foreground text-pretty">
            Cijena kroz vrijeme
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
