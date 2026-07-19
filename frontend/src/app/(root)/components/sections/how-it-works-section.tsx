import { ScrollReveal } from "@/components/ui/scroll-reveal";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import BarcodeDoodle from "@/app/(root)/components/doodles/barcode-doodle";
import PriceTagDoodle from "@/app/(root)/components/doodles/price-tag-doodle";
import CartDoodle from "@/app/(root)/components/doodles/cart-doodle";
import { howItWorksSteps } from "@/app/(root)/components/data/landing";

const stepDoodles = [
  <BarcodeDoodle key="barcode" className="w-24 h-16 text-primary" />,
  <PriceTagDoodle key="tag" className="w-20 h-20 text-primary" />,
  <CartDoodle key="cart" className="w-24 h-20 text-primary" />,
];

export default function HowItWorksSection() {
  return (
    <section>
      <SectionHeading
        title="Kako funkcionira?"
        subtitle="Tri koraka do jeftinije košarice - bez listanja kataloga i letaka."
      />

      <ScrollReveal
        preset="swing"
        stagger={0.15}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {howItWorksSteps.map((step, index) => (
          <div
            key={step.title}
            className="relative bg-card border rounded-3xl p-6 pt-8 text-center space-y-4 shadow-sm"
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 size-9 grid place-items-center rounded-full bg-primary text-primary-foreground font-saira-stencil-semibold text-lg shadow-md">
              {index + 1}
            </span>

            <div className="grid place-items-center h-20">
              {stepDoodles[index]}
            </div>

            <h3 className="text-lg font-semibold">{step.title}</h3>

            <p className="text-sm text-muted-foreground text-pretty">
              {step.description}
            </p>
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
