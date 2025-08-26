"use client";

import { AnimatedGroup } from "@/components/ui/animated-group";
import HeroSection from "@/components/custom/home/hero-section";
import FeaturesSection from "@/components/custom/home/features-section";
import StoresSection from "@/components/custom/home/stores-section";
import PricingSection from "@/components/custom/home/pricing-section";
import StatsSection from "@/components/custom/home/stats-section";

export default function Home() {
  return (
    <>
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                staggerChildren: 0.5,
                delayChildren: 0.75,
              },
            },
          },
          item: {
            hidden: {
              opacity: 0,
              filter: "blur(12px)",
              y: 12,
            },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              transition: {
                type: "spring" as const,
                bounce: 0.3,
                duration: 1.5,
              },
            },
          },
        }}
        className="space-y-48"
      >
        <HeroSection />
        {/* <ImagesSection /> */}
        {/* <FeaturesSection /> */}

        {/* <StoresSection /> */}
        {/* <StatsSection /> */}
        {/* <PricingSection /> */}
        {/* <TestimonialsSection /> */}
      </AnimatedGroup>
    </>
  );
}
