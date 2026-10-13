"use client";

import { Check } from "lucide-react";

import { ALL_CHAINS } from "@/app/map/hooks/use-map-url-state";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

interface IChainFilterChipsProps {
  chains: string[];
  selected: string[] | typeof ALL_CHAINS;
  onChange: (chains: string[] | typeof ALL_CHAINS) => void;
}

/** Toggle chains on and off; "Sve" brings every chain back in one tap. */
export default function ChainFilterChips({
  chains,
  selected,
  onChange,
}: IChainFilterChipsProps) {
  const sorted = [...chains].sort((a, b) =>
    compareHr(getChainLabel(a), getChainLabel(b)),
  );
  const isAll = selected === ALL_CHAINS;

  function toggle(chain: string) {
    const current = isAll ? sorted : selected;
    const next = current.includes(chain)
      ? current.filter((code) => code !== chain)
      : [...current, chain];

    onChange(next.length === sorted.length ? ALL_CHAINS : next);
  }

  const chipClass =
    "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <div
      role="group"
      aria-label="Lanci"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      <button
        type="button"
        onClick={() => onChange(isAll ? [] : ALL_CHAINS)}
        className={cn(
          chipClass,
          isAll ? "border-primary bg-primary/10 font-medium" : "bg-background",
        )}
      >
        {isAll ? "Ukloni sve" : "Odaberi sve"}
      </button>

      {sorted.map((chain) => {
        const isOn = isAll || selected.includes(chain);

        return (
          <button
            key={chain}
            type="button"
            aria-pressed={isOn}
            onClick={() => toggle(chain)}
            className={cn(
              chipClass,
              isOn
                ? "border-primary bg-primary/10"
                : "bg-background text-muted-foreground",
            )}
          >
            {isOn && <Check className="size-3.5" aria-hidden="true" />}
            {getChainLabel(chain)}
          </button>
        );
      })}
    </div>
  );
}
