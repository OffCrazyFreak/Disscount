import { Plus } from "lucide-react";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { AutocompleteItem } from "@/components/reui/autocomplete";
import type { IStoreOption } from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-option-types";

interface IStoreOptionItemProps {
  option: IStoreOption;
}

export default function StoreOptionItem({ option }: IStoreOptionItemProps) {
  return (
    <AutocompleteItem value={option} className="min-h-10 gap-2.5">
      {option.chainCode ? (
        <span className="size-6 shrink-0 overflow-hidden rounded-sm">
          <StoreChainLogo
            chain={option.chainCode}
            width={24}
            height={24}
            className="object-contain"
          />
        </span>
      ) : (
        option.custom && <Plus aria-hidden="true" />
      )}

      <span className="truncate">
        {option.custom ? `Dodaj «${option.label}»` : option.label}
      </span>
    </AutocompleteItem>
  );
}
