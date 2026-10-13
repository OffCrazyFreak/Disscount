import {
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteList,
} from "@/components/reui/autocomplete";
import StoreOptionItem from "@/app/(user)/digital-cards/components/forms/store-field/store-option-item";
import type {
  IStoreGroup,
  IStoreOption,
} from "@/app/(user)/digital-cards/components/forms/store-field/store-option-types";

interface IStoreSuggestionsProps {
  container: HTMLElement | null;
}

export default function StoreSuggestions({
  container,
}: IStoreSuggestionsProps) {
  return (
    // pointer-events-auto because Radix sets none on the body while a dialog is open.
    <AutocompleteContent
      container={container}
      className="pointer-events-auto motion-reduce:transition-none"
    >
      <AutocompleteEmpty>Počni upisivati naziv trgovine.</AutocompleteEmpty>

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
