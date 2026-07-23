import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import BarcodeDoodle from "@/app/(root)/components/doodles/barcode-doodle";
import ScaleDoodle from "@/app/(root)/components/doodles/scale-doodle";
import CartLogo from "@/components/icons/cart-logo";
import { howItWorksSteps } from "@/app/(root)/data/landing";

const stepDoodles = [
  <BarcodeDoodle key="barcode" className="w-24 h-16 text-primary" />,
  <ScaleDoodle key="scale" className="w-20 h-20 text-primary" />,
  <CartLogo key="cart" className="w-28 h-auto text-primary" />,
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
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 size-9 grid place-items-center rounded-full bg-primary text-primary-foreground font-saira-stencil-semibold text-lg shadow-md text-pretty">
              {index + 1}
            </span>

            <div className="grid place-items-center h-24">
              {stepDoodles[index]}
            </div>

            <h3 className="text-lg font-semibold text-pretty">{step.title}</h3>

            <p className="text-sm text-muted-foreground text-pretty">
              {step.description}
            </p>
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
