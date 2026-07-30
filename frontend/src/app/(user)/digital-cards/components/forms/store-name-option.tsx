"use client";

import { Check, Store } from "lucide-react";

import { CommandItem } from "@/components/ui/command";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import type { IStoreOption } from "@/app/(user)/digital-cards/hooks/use-store-name-options";

interface IStoreNameOptionProps {
  option: IStoreOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function StoreNameOption({
  option,
  isSelected,
  onSelect,
}: IStoreNameOptionProps) {
  return (
    <CommandItem value={option.label} onSelect={onSelect} className="gap-2">
      <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-sm">
        {option.chainCode ? (
          <StoreChainLogo chain={option.chainCode} width={24} height={24} />
        ) : (
          <Store aria-hidden="true" className="size-4 text-muted-foreground" />
        )}
      </span>

      <span className="truncate">{option.label}</span>

      {isSelected && (
        <Check aria-hidden="true" className="ml-auto size-4 text-primary" />
      )}
    </CommandItem>
  );
}
