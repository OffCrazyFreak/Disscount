import { Metadata } from "next";
import LandingJsonLd from "@/app/(root)/components/json-ld";
import HeroSection from "@/app/(root)/components/sections/hero-section";
import StatsBand from "@/app/(root)/components/sections/stats-band";
import HowItWorksSection from "@/app/(root)/components/sections/how-it-works-section";
import FeaturesSection from "@/app/(root)/components/sections/features-section";
import PriceHistorySection from "@/app/(root)/components/sections/price-history-section";
import StoresSection from "@/app/(root)/components/sections/stores-section";
import PwaSection from "@/app/(root)/components/sections/pwa-section";
import PricingSection from "@/app/(root)/components/sections/pricing-section";
import TrustSection from "@/app/(root)/components/sections/trust-section";
import FaqSection from "@/app/(root)/components/sections/faq-section";
import FinalCtaSection from "@/app/(root)/components/sections/final-cta-section";

export const metadata: Metadata = {
  title: "Pronađi najbolje cijene u Hrvatskoj",
  description:
    "Usporedi cijene proizvoda u 29 trgovačkih lanaca u Hrvatskoj, prati povijest cijena, izradi pametne popise za kupnju i uštedi pri svakoj kupnji. Besplatno.",
};

export default function Home() {
  return (
    <div className="space-y-14 sm:space-y-20 pb-16">
      <LandingJsonLd />

      <HeroSection />
      <StatsBand />
      <HowItWorksSection />
      <FeaturesSection />
      <PriceHistorySection />
      <StoresSection />
      <PwaSection />
      <PricingSection />
      <TrustSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
