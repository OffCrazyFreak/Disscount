"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DigitalCardFormData } from "@/lib/api/types";
import { getCodeTypeGroups } from "@/app/(user)/digital-cards/utils/code-symbologies";

export default function CodeTypeField() {
  const form = useFormContext<DigitalCardFormData>();
  const groups = getCodeTypeGroups();

  return (
    <FormField
      control={form.control}
      name="codeType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tip koda</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Odaberi tip koda" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Provjeri prikaz koda ispod. Ako se ne prikazuje, probaj drugi tip.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
