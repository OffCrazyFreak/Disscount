"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function BarcodeValueField() {
  const t = useTranslations("digitalCards.form");
  const form = useFormContext<DigitalCardRequest>();
  const switchId = useId();
  const barcodeValue = useWatch({
    control: form.control,
    name: "barcodeValue",
  });

  // Derived from the value: an empty string keeps the input open mid-edit, null closes it,
  // and a form reset turns the toggle off with no extra state to clear.
  const enabled = barcodeValue != null;

  function handleToggle(checked: boolean) {
    form.setValue("barcodeValue", checked ? "" : null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={switchId} className="leading-snug">
          {t("barcodeDiffers")}
        </Label>
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && (
        <FormField
          control={form.control}
          name="barcodeValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("barcodeValueLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
