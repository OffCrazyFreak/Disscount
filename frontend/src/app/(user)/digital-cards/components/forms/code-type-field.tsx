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
import { CODE_TYPES, CODE_TYPE_LABELS } from "@/constants/card-codes";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CodeTypeField() {
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name="codeType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tip koda</FormLabel>

          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Odaberi tip koda" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CODE_TYPES.map((codeType) => (
                <SelectItem key={codeType} value={codeType}>
                  {CODE_TYPE_LABELS[codeType]}
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
