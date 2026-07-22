import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SparkleField from "@/app/(root)/components/doodles/sparkle-field";
import CartLogo from "@/components/icons/cart-logo";

const ctaPalette = [
  "text-primary-foreground/60",
  "text-primary-foreground/40",
  "text-primary-foreground/25",
];

export default function FinalCtaSection() {
  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-14 sm:py-16 text-center shadow-lg">
        <SparkleField
          count={6}
          seed="cta-sparkles"
          palette={ctaPalette}
          className="absolute inset-0"
        />
        <CartLogo className="absolute -bottom-3 -right-4 w-32 sm:w-44 h-auto text-primary-foreground/25" />

        <ScrollReveal preset="pop" className="relative space-y-6">
          <h2 className="text-4xl sm:text-5xl font-saira-stencil-semibold text-pretty">
            Želiš uštedjeti?
          </h2>

          <p className="max-w-md mx-auto text-primary-foreground/90 text-pretty">
            Pretraga radi odmah, bez registracije. Račun ti treba tek kad
            poželiš spremati popise i pratiti proizvode.
          </p>

          <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full border-2 border-white/70 font-semibold text-white hover:bg-white/15 hover:text-white sm:flex-1"
            >
              <Link href="/products">Kreni s pretragom</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full border-2 border-transparent bg-white font-semibold text-primary hover:bg-white/90 sm:flex-1"
            >
              <Link href="/?modal=signup">Stvori besplatni račun</Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
