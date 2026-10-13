"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import CardColorPicker from "@/app/(user)/digital-cards/components/forms/color-picker/card-color-picker";
import { findPaletteColor } from "@/app/(user)/digital-cards/utils/card-palette";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CardColorField() {
  const form = useFormContext<DigitalCardRequest>();
  const labelId = useId();

  return (
    <FormField
      control={form.control}
      name="cardColor"
      render={({ field }) => (
        <FormItem>
          <p id={labelId} className="text-sm leading-none font-medium">
            Boja kartice: {findPaletteColor(field.value)?.name ?? "prilagođena"}
          </p>
          <div className="flex justify-center py-2">
            <CardColorPicker
              value={field.value}
              onChange={field.onChange}
              labelledBy={labelId}
            />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
