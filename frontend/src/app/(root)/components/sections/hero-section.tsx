import HeroActions from "@/app/(root)/components/sections/hero-actions";
import HeroCart from "@/app/(root)/components/sections/hero-cart";
import HeroTagline from "@/app/(root)/components/sections/hero-tagline";
import SquiggleUnderline from "@/app/(root)/components/doodles/squiggle-underline";
import SparkleField from "@/app/(root)/components/doodles/sparkle-field";
import { StaggerChildren } from "@/components/ui/stagger-children";

export default function HeroSection() {
  return (
    <section className="min-h-[70dvh] relative grid items-center">
      <SparkleField
        count={9}
        seed="hero-sparkles"
        className="absolute inset-0"
      />

      <StaggerChildren
        className="text-center space-y-12 sm:space-y-20"
        distance={16}
        stagger={0.12}
      >
        <div className="space-y-6">
          <HeroCart />

          <p className="text-5xl sm:text-7xl text-primary font-saira-stencil-semibold text-pretty">
            disscount
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-pretty max-w-2xl mx-auto">
            Pronađi{" "}
            <span className="relative inline-block">
              najbolje cijene
              <SquiggleUnderline className="absolute -bottom-2 left-0 w-full h-3 text-primary" />
            </span>{" "}
            u Hrvatskoj
          </h1>

          <p className="uppercase max-w-md mx-auto text-pretty text-base sm:text-lg text-muted-foreground">
            <HeroTagline />
          </p>
        </div>

        <HeroActions />
      </StaggerChildren>
    </section>
  );
}
