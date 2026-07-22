import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/app/(root)/components/sections/section-heading";
import StoresMarquee from "@/app/(root)/components/sections/stores-marquee";

export default function StoresSection() {
  return (
    <section>
      <SectionHeading
        title="Svi veliki lanci na jednom mjestu"
        subtitle="Od Konzuma i Lidla do kvartovskih trgovina - cijene iz 29 trgovačkih lanaca diljem Hrvatske."
      />

      <StoresMarquee />

      <div className="mt-8 text-center">
        <Button asChild variant="link" effect="underline" className="text-base">
          <Link href="/products?discounted=true">
            Pogledaj sve popuste
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
