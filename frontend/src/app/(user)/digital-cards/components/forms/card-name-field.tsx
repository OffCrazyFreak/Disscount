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
import type { DigitalCardFormData } from "@/lib/api/types";

export default function CardNameField() {
  const form = useFormContext<DigitalCardFormData>();

  return (
    <FormField
      control={form.control}
      name="cardName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Naziv kartice</FormLabel>
          <FormControl>
            <Input {...field} autoFocus placeholder="npr. Konzum Multiplus" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
