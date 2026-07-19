import Image from "next/image";
import HeroActions from "@/app/(root)/components/sections/hero-actions";
import HeroTagline from "@/app/(root)/components/sections/hero-tagline";
import SquiggleUnderline from "@/app/(root)/components/doodles/squiggle-underline";
import SparkleDoodle from "@/app/(root)/components/doodles/sparkle-doodle";
import { StaggerChildren } from "@/components/ui/stagger-children";

export default function HeroSection() {
  return (
    <section className="min-h-[70dvh] relative grid items-center">
      <SparkleDoodle className="absolute top-[8%] left-[12%] w-6 text-primary" />
      <SparkleDoodle
        className="absolute top-[16%] right-[10%] w-8 text-secondary"
        delay={0.8}
      />
      <SparkleDoodle
        className="absolute bottom-[14%] left-[6%] w-5 text-secondary"
        delay={1.5}
      />

      <StaggerChildren
        className="text-center space-y-12 sm:space-y-20"
        distance={16}
        stagger={0.12}
      >
        <div className="space-y-6">
          <Image
            src="/disscount-logo.png"
            alt="Disscount logo"
            width={512}
            height={512}
            priority
            className="mx-auto w-32 sm:w-44"
          />

          <p className="text-5xl sm:text-7xl text-primary font-saira-stencil-semibold">
            disscount
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-balance max-w-2xl mx-auto">
            Pronađi{" "}
            <span className="relative inline-block">
              najbolje cijene
              <SquiggleUnderline className="absolute -bottom-2 left-0 w-full h-3 text-primary" />
            </span>{" "}
            u Hrvatskoj
          </h1>

          <p className="uppercase max-w-md mx-auto text-pretty text-md sm:text-lg text-muted-foreground">
            <HeroTagline />
          </p>
        </div>

        <HeroActions />
      </StaggerChildren>
    </section>
  );
}
