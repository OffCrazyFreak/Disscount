"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import CardColorPicker from "@/app/[locale]/(user)/digital-cards/components/forms/color-picker/card-color-picker";
import { findPaletteColor } from "@/app/[locale]/(user)/digital-cards/utils/card-palette";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CardColorField() {
  const t = useTranslations("digitalCards.form");
  const tColors = useTranslations("digitalCards.colors");
  const form = useFormContext<DigitalCardRequest>();
  const labelId = useId();

  return (
    <FormField
      control={form.control}
      name="cardColor"
      render={({ field }) => {
        const palette = findPaletteColor(field.value);

        return (
          <FormItem>
            <p id={labelId} className="text-sm leading-none font-medium">
              {t("colorLabel", {
                color: palette
                  ? tColors(`${palette.id}.name`)
                  : t("colorCustom"),
              })}
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
        );
      }}
    />
  );
}
