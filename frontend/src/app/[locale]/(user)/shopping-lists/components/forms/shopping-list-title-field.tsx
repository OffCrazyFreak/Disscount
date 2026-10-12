"use client";

import type { Control } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ShoppingListRequest } from "@/lib/api/types";

interface IShoppingListTitleFieldProps {
  control: Control<ShoppingListRequest>;
  /** Off where the field is not the point of the modal, or where it mounts late. */
  autoFocus?: boolean;
}

/**
 * The list name, shared by the create, edit and copy modals so the label, the
 * placeholder and the validation message read the same in all three.
 */
export default function ShoppingListTitleField({
  control,
  autoFocus = true,
}: IShoppingListTitleFieldProps) {
  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Naziv popisa</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Roštilj 01.05.2026."
              autoFocus={autoFocus}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
