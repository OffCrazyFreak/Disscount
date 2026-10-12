import { Metadata } from "next";
import LandingJsonLd from "@/app/[locale]/(root)/components/json-ld";
import HeroSection from "@/app/[locale]/(root)/components/sections/hero-section";
import StatsBand from "@/app/[locale]/(root)/components/sections/stats-band";
import HowItWorksSection from "@/app/[locale]/(root)/components/sections/how-it-works-section";
import FeaturesSection from "@/app/[locale]/(root)/components/sections/features-section";
import PriceHistorySection from "@/app/[locale]/(root)/components/sections/price-history-section";
import StoresSection from "@/app/[locale]/(root)/components/sections/stores-section";
import PwaSection from "@/app/[locale]/(root)/components/sections/pwa-section";
import PricingSection from "@/app/[locale]/(root)/components/sections/pricing-section";
import FaqSection from "@/app/[locale]/(root)/components/sections/faq-section";
import FinalCtaSection from "@/app/[locale]/(root)/components/sections/final-cta-section";

export const metadata: Metadata = {
  title: "Pronađi najbolje cijene u Hrvatskoj",
  description:
    "Usporedi cijene proizvoda u 25+ trgovačkih lanaca u Hrvatskoj, prati povijest cijena, izradi pametne popise za kupnju i uštedi pri svakoj kupnji. Besplatno.",
};

export default function Home() {
  return (
    <div className="space-y-14 pb-10">
      <LandingJsonLd />

      <HeroSection />
      <StatsBand />
      <HowItWorksSection />
      <FeaturesSection />
      <PriceHistorySection />
      <StoresSection />
      <PwaSection />
      <PricingSection />
      {/* TODO: Add the "Zajedno gradimo Disscount" contributor and opted-in supporter section here. */}
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
