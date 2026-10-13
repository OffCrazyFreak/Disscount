import { useTranslations } from "next-intl";
import Image from "next/image";
import { CloudOff, RefreshCw } from "lucide-react";
import { ScrollReveal } from "@/components/custom/animation/scroll-reveal";
import TextGlow from "@/components/custom/common/text-glow";
import InstallCard from "@/components/custom/pwa/install-card";
import InstallPerk from "@/components/custom/pwa/install-perk";

const perks = [
  { id: "offline", icon: CloudOff },
  { id: "sync", icon: RefreshCw },
] as const;

export default function PwaSection() {
  const t = useTranslations("landing");

  return (
    <section className="overflow-x-clip">
      <ScrollReveal
        preset="rise"
        className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative mx-auto order-last w-full sm:w-auto sm:ml-2">
          <Image
            src="/screenshots/screenshot-narrow.png"
            alt={t("pwa.screenshotPhoneAlt")}
            width={380}
            height={760}
            className="relative z-10 ml-[6%] w-[46%] sm:ml-0 sm:w-64 rounded-lg sm:rounded-3xl border-4 border-foreground/80 shadow-xl -rotate-2"
          />
          <Image
            src="/screenshots/screenshot-wide.png"
            alt={t("pwa.screenshotDesktopAlt")}
            width={640}
            height={400}
            className="absolute top-1/2 left-[28%] sm:left-[35%] -translate-y-1/2 z-10 md:z-0 w-[66%] sm:w-84 rotate-6 rounded-xl border shadow-xl"
          />
        </div>

        <div className="relative isolate">
          <TextGlow className="-inset-6" />

          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-pretty">
              {t("pwa.title")}
            </h2>

            <div className="space-y-5">
              <InstallPerk />

              {perks.map((perk) => (
                <div key={perk.id} className="flex items-center gap-4">
                  <div className="size-11 md:size-16 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <perk.icon
                      aria-hidden="true"
                      className="size-6 md:size-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-pretty">
                      {t(`pwa.perks.${perk.id}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {t(`pwa.perks.${perk.id}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <InstallCard permanent />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
