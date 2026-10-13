"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { DigitalCardRequest } from "@/lib/api/types";

const DATE_FIELDS = [
  { name: "validFrom", labelKey: "validFrom" },
  { name: "expiresOn", labelKey: "validUntil" },
] as const;

export default function CardDatesFields() {
  const t = useTranslations("digitalCards.form");
  const form = useFormContext<DigitalCardRequest>();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {DATE_FIELDS.map(({ name, labelKey }) => (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t(labelKey)}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(event.target.value || null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
