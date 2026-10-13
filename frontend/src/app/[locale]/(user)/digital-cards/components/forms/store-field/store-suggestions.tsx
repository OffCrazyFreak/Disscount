import { useTranslations } from "next-intl";

import {
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteList,
} from "@/components/reui/autocomplete";
import StoreOptionItem from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-option-item";
import type {
  IStoreGroup,
  IStoreOption,
} from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-option-types";

interface IStoreSuggestionsProps {
  container: HTMLElement | null;
}

export default function StoreSuggestions({
  container,
}: IStoreSuggestionsProps) {
  const t = useTranslations("digitalCards.form");

  return (
    // pointer-events-auto because Radix sets none on the body while a dialog is open.
    <AutocompleteContent
      container={container}
      className="pointer-events-auto motion-reduce:transition-none"
    >
      <AutocompleteEmpty>{t("storeEmpty")}</AutocompleteEmpty>

      <AutocompleteList>
        {(group: IStoreGroup) => (
          <AutocompleteGroup key={group.value || "custom"} items={group.items}>
            {group.value && (
              <AutocompleteGroupLabel>{group.value}</AutocompleteGroupLabel>
            )}

            <AutocompleteCollection>
              {(option: IStoreOption) => (
                <StoreOptionItem key={option.value} option={option} />
              )}
            </AutocompleteCollection>
          </AutocompleteGroup>
        )}
      </AutocompleteList>
    </AutocompleteContent>
  );
}
