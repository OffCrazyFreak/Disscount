import { Suspense } from "react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import HeroSection from "@/app/(root)/components/sections/hero-section";
import FeaturesSection from "@/app/(root)/components/sections/features-section";
import StoresSection from "@/app/(root)/components/sections/stores-section";
import PricingSection from "@/app/(root)/components/sections/pricing-section";
import StatsSection from "@/app/(root)/components/sections/stats-section";

export default function Home() {
  return (
    <>
      <div className="space-y-48">
        <HeroSection />
        {/* <ImagesSection /> */}
        {/* <FeaturesSection /> */}

        {/* <StoresSection /> */}
        {/* <StatsSection /> */}
        {/* <PricingSection /> */}
        {/* <TestimonialsSection /> */}
      </div>
    </>
  );
}
