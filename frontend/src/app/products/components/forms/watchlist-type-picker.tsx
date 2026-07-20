"use client";

import { useFormContext } from "react-hook-form";
import { TrendingDown, Percent, LucideIcon } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { WatchType } from "@/lib/api";
import type { WatchlistFormData } from "@/app/products/typings/watchlist-form";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: WatchType;
  icon: LucideIcon;
  label: string;
  description: string;
}[] = [
  {
    value: WatchType.absolute,
    icon: TrendingDown,
    label: "Cijena",
    description: "Obavijesti kad cijena padne za određeni iznos",
  },
  {
    value: WatchType.percentage,
    icon: Percent,
    label: "Postotak",
    description: "Obavijesti kad popust bude veći od određenog postotka",
  },
];

export default function WatchlistTypePicker() {
  const form = useFormContext<WatchlistFormData>();

  return (
    <FormField
      control={form.control}
      name="watchType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Način praćenja</FormLabel>
          <FormControl>
            <div className="grid grid-cols-2 gap-4">
              {OPTIONS.map(({ value, icon: Icon, label, description }) => (
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
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
