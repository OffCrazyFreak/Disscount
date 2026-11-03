"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { commandFilter } from "@/utils/search/command-filter";
import type { IStoreTown } from "@/utils/store-towns";
import { useTownLabel } from "@/hooks/use-town-label";

interface ITownPickerProps {
  /** Shown as a small link beside a sort that already starts from a town. */
  isChange: boolean;
  towns: IStoreTown[];
  onPick: (town: string) => void;
}

/** A searchable list of the towns with stores, matched by name or postcode. */
export default function TownPicker({
  isChange,
  towns,
  onPick,
}: ITownPickerProps) {
  const t = useTranslations("common.distanceSort");
  const townLabel = useTownLabel();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* One button for both looks, so focus comes back to it after a pick. */}
      <PopoverTrigger asChild>
        <Button
          variant={isChange ? "link" : "outline"}
          size="sm"
          className={isChange ? "h-auto p-0" : undefined}
          aria-label={isChange ? t("changeTownLabel") : undefined}
        >
          {!isChange && <MapPin aria-hidden="true" />}
          {isChange ? t("changeTown") : t("pickTown")}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-xs max-w-[75dvw] p-0" align="start">
        <Command filter={commandFilter}>
          <CommandInput
            placeholder={t("townSearch")}
            aria-label={t("townSearch")}
          />
          <CommandList aria-label={t("townList")}>
            <CommandEmpty>{t("townEmpty")}</CommandEmpty>

            {towns.map((town) => (
              <CommandItem
                key={town.key}
                value={town.key}
                keywords={[townLabel(town), ...town.zipcodes]}
                onSelect={() => {
                  onPick(town.key);
                  setOpen(false);
                }}
              >
                {townLabel(town)}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
