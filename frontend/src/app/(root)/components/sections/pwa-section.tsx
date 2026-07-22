import Image from "next/image";
import { MonitorSmartphone, CloudOff, RefreshCw } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import TextGlow from "@/components/custom/common/text-glow";

const perks = [
  {
    icon: MonitorSmartphone,
    title: "Instaliraj kao aplikaciju",
    description:
      "Bez trgovine aplikacija - dodaj Disscount na početni zaslon izravno iz preglednika.",
  },
  {
    icon: CloudOff,
    title: "Popisi dostupni offline",
    description:
      "Popisi za kupnju i pregledani proizvodi rade i bez signala, usred dućana.",
  },
  {
    icon: RefreshCw,
    title: "Sinkronizacija kad se vratiš",
    description:
      "Promjene napravljene offline automatski se spremaju čim se vratiš na mrežu.",
  },
];

export default function PwaSection() {
  return (
    <section className="overflow-x-clip">
      <ScrollReveal
        preset="rise"
        className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative mx-auto order-last ml-2">
          <Image
            src="/screenshots/screenshot-narrow.png"
            alt="Disscount aplikacija na mobitelu"
            width={380}
            height={760}
            className="relative z-10 w-36 sm:w-64 rounded-lg sm:rounded-3xl border-4 border-foreground/80 shadow-xl -rotate-2"
          />
          <Image
            src="/screenshots/screenshot-wide.png"
            alt="Disscount aplikacija na računalu"
            width={640}
            height={400}
            className="absolute top-1/2 left-[30%] sm:left-[35%] -translate-y-1/2 z-10 md:z-0 w-52 sm:w-84 rotate-6 rounded-xl border shadow-xl"
          />
        </div>

        <div className="relative isolate">
          <TextGlow className="-inset-6" />

          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              Aplikacija koja radi i bez interneta
            </h2>

            <div className="space-y-5">
              {perks.map((perk) => (
                <div key={perk.title} className="flex gap-4">
                  <div className="size-11 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <perk.icon className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{perk.title}</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {perk.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
