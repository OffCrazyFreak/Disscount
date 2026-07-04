import Image from "next/image";
import { getTranslations } from "next-intl/server";
import HeroActions from "@/app/(root)/components/sections/hero-actions";

function pickRandom(taglines: string[]): string {
  const randomIndex = Math.floor(Math.random() * taglines.length);
  return taglines[randomIndex];
}

export default async function HeroSection() {
  const t = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  // `taglines` is an array message; `t.raw` returns it untransformed.
  const taglines = t.raw("taglines") as string[];
  const tagLine = pickRandom(taglines);

  return (
    <section className="min-h-[70dvh] relative grid items-center">
      <div className="text-center space-y-12 sm:space-y-24">
        <div className="space-y-6">
          {/* App logo */}
          <Image
            src="/disscount-logo.png"
            alt={tCommon("logoAlt")}
            width={512}
            height={512}
            className="mx-auto w-32 sm:w-48"
          />

          <h1 className="text-5xl sm:text-7xl text-primary font-saira-stencil-semibold">
            disscount
          </h1>

          <p className="uppercase max-w-md mx-auto text-pretty text-md sm:text-lg">
            {tagLine}
          </p>
        </div>

        <HeroActions />
      </div>
    </section>
  );
}
