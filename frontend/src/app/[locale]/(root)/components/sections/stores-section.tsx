import { useTranslations } from "next-intl";
import SectionHeading from "@/app/[locale]/(root)/components/sections/section-heading";
import StoresMarquee from "@/app/[locale]/(root)/components/sections/stores-marquee";

export default function StoresSection() {
  const t = useTranslations("landing");

  return (
    <section>
      <SectionHeading
        title={t("stores.title")}
        subtitle={t("stores.subtitle")}
      />

      <StoresMarquee />
    </section>
  );
}
