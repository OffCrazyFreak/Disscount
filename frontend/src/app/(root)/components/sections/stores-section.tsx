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
    </section>
  );
}
