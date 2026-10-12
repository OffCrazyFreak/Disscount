"use client";

import { useId, useState } from "react";
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
  const form = useFormContext<DigitalCardRequest>();
  const switchId = useId();
  const barcodeValue = useWatch({
    control: form.control,
    name: "barcodeValue",
  });

  // Once opened it stays open while the text is emptied, or the input would vanish mid-edit.
  const [opened, setOpened] = useState(false);
  const enabled = opened || !!barcodeValue;

  function handleToggle(checked: boolean) {
    setOpened(checked);
    if (!checked) {
      form.setValue("barcodeValue", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={switchId} className="leading-snug">
          Kod na kartici se razlikuje od broja
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
              <FormLabel>Vrijednost koda</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) => {
                    setOpened(true);
                    field.onChange(event.target.value);
                  }}
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
