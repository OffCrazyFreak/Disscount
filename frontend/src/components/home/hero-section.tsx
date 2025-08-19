import React from "react";
import Image from "next/image";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import HeroActions from "@/components/home/hero-actions";

const tagLines: string[] = [
  "Usporedi trgovine i cijene!",
  "Uštedi pri svakoj kupnji!",
  "Nikad ne propusti akciju!",
  "Zaboravi kartice - olakšaj novčanik!",
  "Izradi i podijeli popis za kupnju!",
  "Prati povijest cijena!",
  "Skeniraj barkod i usporedi cijene!",
  "Uživaj u pametnom kupovanju!",
  "Pronađi najbolje ponude u Hrvatskoj!",
  "Kupuj kvalitetno i jeftino!",
  "Kupuj pametno, uštedi više!",
];

function getTagLine(): string {
  const randomIndex = Math.floor(Math.random() * tagLines.length);
  return tagLines[randomIndex];
}

export default function HeroSection(): React.JSX.Element {
  const tagLine: string = getTagLine();

  return (
    <section className="min-h-dvh relative grid items-center">
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                delayChildren: 1,
              },
            },
          },
          item: {
            hidden: {
              opacity: 0,
              y: 20,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                bounce: 0.3,
                duration: 2,
              },
            },
          },
        }}
        className="absolute inset-0 -z-20"
      >
        <></>
        {/* TODO neka pozadinska slika/graf */}
      </AnimatedGroup>

      <div className="text-center space-y-24">
        <div className="space-y-6">
          <TextEffect
            preset="fade-in-blur"
            speedSegment={0.3}
            as="h1"
            className="text-6xl text-primary font-bold"
          >
            Disscount
          </TextEffect>

          <TextEffect
            per="line"
            preset="fade-in-blur"
            speedSegment={0.3}
            delay={0.5}
            as="p"
            className="uppercase max-w-md mx-auto text-balance text-lg"
          >
            {tagLine}
          </TextEffect>
        </div>

        <HeroActions />
      </div>
    </section>
  );
}
