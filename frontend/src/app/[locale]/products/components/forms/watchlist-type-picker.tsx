"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { TrendingDown, Percent, LucideIcon } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { WatchType } from "@/lib/api";
import type { WatchlistFormData } from "@/app/[locale]/products/typings/watchlist-form";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: WatchType;
  icon: LucideIcon;
  labelKey: "typePicker.absolute.label" | "typePicker.percentage.label";
  descriptionKey:
    "typePicker.absolute.description" | "typePicker.percentage.description";
}[] = [
  {
    value: WatchType.absolute,
    icon: TrendingDown,
    labelKey: "typePicker.absolute.label",
    descriptionKey: "typePicker.absolute.description",
  },
  {
    value: WatchType.percentage,
    icon: Percent,
    labelKey: "typePicker.percentage.label",
    descriptionKey: "typePicker.percentage.description",
  },
];

export default function WatchlistTypePicker() {
  const t = useTranslations("products");
  const form = useFormContext<WatchlistFormData>();

  return (
    <FormField
      control={form.control}
      name="watchType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("typePicker.label")}</FormLabel>
          <FormControl>
            <div className="grid grid-cols-2 gap-4">
              {OPTIONS.map(
                ({ value, icon: Icon, labelKey, descriptionKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                      field.value === value
                        ? "border-primary bg-primary/5"
                        : "border-muted",
                    )}
                  >
                    <Icon className="mb-3 size-6" />
                    <span className="text-sm font-medium">{t(labelKey)}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {t(descriptionKey)}
                    </span>
                  </button>
                ),
              )}
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
