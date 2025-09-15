import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { AddToListFormData } from "@/app/products/typings/add-to-list";

interface IQuantityInputProps {
  field: UseFormReturn<AddToListFormData>;
}

export default function QuantityInput({ field }: IQuantityInputProps) {
  return (
    <FormField
      control={field.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Količina</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
