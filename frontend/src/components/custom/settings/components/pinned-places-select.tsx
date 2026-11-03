"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/custom/form/multi-select";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import cijeneService from "@/lib/cijene-api";
import { useTownLabel } from "@/hooks/use-town-label";
import { listPlaceOptions } from "@/utils/place-options";

export default function PinnedPlacesSelect() {
  const t = useTranslations("settings");
  const form = useFormContext<SettingsFormValues>();
  const { data: locations } = useAllLocations();
  // The same cached query the locations come from; it carries the postcodes.
  const { data: storesData } = cijeneService.useSearchStores();
  const townLabel = useTownLabel();

  return (
    <FormField
      control={form.control}
      name="pinnedPlaces"
      render={({ field }) => (
        <FormItem className="gap-0">
          <MultiSelect onValuesChange={field.onChange} values={field.value}>
            <FormControl>
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  placeholder={t("preferences.places.placeholder")}
                />
              </MultiSelectTrigger>
            </FormControl>
            <MultiSelectContent className="bg-popover">
              <MultiSelectGroup>
                {listPlaceOptions(
                  locations.map((location) => location.name),
                  storesData?.stores ?? [],
                  field.value,
                ).map((place) => (
                  <MultiSelectItem
                    key={place.key}
                    value={place.key}
                    keywords={[townLabel(place)]}
                  >
                    {townLabel(place)}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
