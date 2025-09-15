import { AnimatedGroup } from "@/components/ui/animated-group";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function StoresSection() {
  return (
    <section>
      <div className="group relative">
        <div className="absolute inset-0 z-10 scale-90 grid place-items-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <Link
            href="/products?discounted=true"
            className="block duration-150 hover:opacity-75"
          >
            <span>Pogledaj akcije</span>

            <ChevronRight className="ml-1 inline-block" />
          </Link>
        </div>

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.75,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                filter: "blur(12px)",
                y: 12,
              },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                  type: "spring" as const,
                  bounce: 0.3,
                  duration: 1.5,
                },
              },
            },
          }}
          className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14"
        >
          <div className="flex">
            <img
              className="mx-auto h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/nvidia.svg"
              alt="Nvidia Logo"
              height="20"
              width="auto"
            />
          </div>

          <div className="flex">
            <img
              className="mx-auto h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/column.svg"
              alt="Column Logo"
              height="16"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              className="mx-auto h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/github.svg"
              alt="GitHub Logo"
              height="16"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              className="mx-auto h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/nike.svg"
              alt="Nike Logo"
              height="20"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              className="mx-auto h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
              alt="Lemon Squeezy Logo"
              height="20"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              className="mx-auto h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/laravel.svg"
              alt="Laravel Logo"
              height="16"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              className="mx-auto h-7 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/lilly.svg"
              alt="Lilly Logo"
              height="28"
              width="auto"
            />
          </div>

          <div className="flex">
            <img
              className="mx-auto h-6 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/openai.svg"
              alt="OpenAI Logo"
              height="24"
              width="auto"
            />
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}
