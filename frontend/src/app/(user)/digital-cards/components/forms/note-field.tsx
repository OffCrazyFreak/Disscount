"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { DigitalCardFormData } from "@/lib/api/types";

export default function NoteField() {
  const form = useFormContext<DigitalCardFormData>();

  return (
    <FormField
      control={form.control}
      name="note"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bilješka</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value || null)}
              rows={2}
              placeholder="npr. kartica vrijedi i u Bosni"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
