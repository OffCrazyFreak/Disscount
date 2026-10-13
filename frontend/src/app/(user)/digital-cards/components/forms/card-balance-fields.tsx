"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DigitalCardRequest } from "@/lib/api/types";

// Radix Select cannot hold an empty value, so points get a stand-in that maps to null.
const POINTS_VALUE = "POINTS";

export default function CardBalanceFields() {
  const form = useFormContext<DigitalCardRequest>();

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3">
      <FormField
        control={form.control}
        name="balance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stanje</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                {...field}
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="balanceUnit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jedinica</FormLabel>
            <Select
              value={field.value ?? POINTS_VALUE}
              onValueChange={(value) =>
                field.onChange(value === POINTS_VALUE ? null : value)
              }
            >
              <FormControl>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value={POINTS_VALUE}>Bodovi</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
