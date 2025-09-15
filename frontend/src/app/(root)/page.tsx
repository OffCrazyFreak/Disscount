import HeroSection from "@/app/(root)/components/sections/hero-section";
import FeaturesSection from "@/app/(root)/components/sections/features-section";
import StoresSection from "@/app/(root)/components/sections/stores-section";
import PricingSection from "@/app/(root)/components/sections/pricing-section";
import StatsSection from "@/app/(root)/components/sections/stats-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pronađi najbolje cijene u Hrvatskoj",
  description:
    "App for shoppers in Croatia to compare store prices, create smart shopping lists, track loyalty cards, and get deal alerts with barcode scanning & AI suggestions.",
};

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
