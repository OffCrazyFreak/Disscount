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
import type { DigitalCardFormData } from "@/lib/api/types";
import { getCardTypeOptions } from "@/app/(user)/digital-cards/utils/card-labels";

export default function CardTypeField() {
  const form = useFormContext<DigitalCardFormData>();
  const options = getCardTypeOptions();

  return (
    <FormField
      control={form.control}
      name="cardType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tip kartice</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Odaberi tip" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
