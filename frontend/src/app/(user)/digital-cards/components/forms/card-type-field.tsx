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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_TYPES, CARD_TYPE_LABELS } from "@/constants/card-codes";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CardTypeField() {
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name="cardType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vrsta kartice</FormLabel>

          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Odaberi vrstu" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CARD_TYPES.map((cardType) => (
                <SelectItem key={cardType} value={cardType}>
                  {CARD_TYPE_LABELS[cardType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
