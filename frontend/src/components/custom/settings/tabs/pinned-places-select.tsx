"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";

export function PinnedPlacesSelect() {
  const form = useFormContext<SettingsFormValues>();
  const { data: locations } = useAllLocations();

  return (
    <FormField
      control={form.control}
      name="pinnedPlaces"
      render={({ field }) => (
        <FormItem className="gap-0">
          <FormLabel className="text-md w-max">Lokacije</FormLabel>
          <p className="text-sm text-gray-500 mb-2">
            Odaberi lokacije u tvojoj blizini.
          </p>

          <MultiSelect onValuesChange={field.onChange} values={field.value}>
            <FormControl>
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Odaberi lokacije..." />
              </MultiSelectTrigger>
            </FormControl>
            <MultiSelectContent className="bg-white">
              <MultiSelectGroup>
                {locations
                  .slice()
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, "hr", { sensitivity: "base" })
                  )
                  .map((location) => (
                    <MultiSelectItem key={location.name} value={location.name}>
                      {location.name}
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
