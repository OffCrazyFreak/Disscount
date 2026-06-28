import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { AddToListFormData } from "@/app/products/typings/add-to-list";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

interface IQuantityInputProps {
  formField: UseFormReturn<AddToListFormData>;
}

export default function QuantityInput({ formField }: IQuantityInputProps) {
  return (
    <FormField
      control={formField.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Količina</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4 mx-auto my-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label="Smanji količinu za 5"
                className="hidden sm:flex size-14 rounded-full shrink-0 text-lg font-bold"
                onClick={() => field.onChange(Math.max(1, field.value - 5))}
                disabled={field.value <= 5}
              >
                -5
              </Button>

              <Button
                type="button"
                size="icon"
                aria-label="Smanji količinu za 2"
                className="size-13 rounded-full shrink-0 text-lg font-bold"
                onClick={() => field.onChange(Math.max(1, field.value - 2))}
                disabled={field.value <= 2}
              >
                -2
              </Button>

              <Input
                type="number"
                min={1}
                max={MAX_SHOPPING_LIST_ITEM_AMOUNT}
                className="text-center w-20 sm:w-40"
                {...field}
                onChange={(e) => {
                  // valueAsNumber parses the full number (e.g. 1e2 -> 100);
                  // floor keeps it an integer count without truncating like parseInt
                  const value = Math.floor(e.target.valueAsNumber);

                  field.onChange(
                    isNaN(value) || value < 1
                      ? 1
                      : Math.min(MAX_SHOPPING_LIST_ITEM_AMOUNT, value),
                  );
                }}
              />

              <Button
                type="button"
                size="icon"
                aria-label="Povećaj količinu za 2"
                className="size-13 rounded-full shrink-0 text-lg font-bold"
                onClick={() =>
                  field.onChange(
                    Math.min(MAX_SHOPPING_LIST_ITEM_AMOUNT, field.value + 2),
                  )
                }
                disabled={field.value >= MAX_SHOPPING_LIST_ITEM_AMOUNT}
              >
                +2
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label="Povećaj količinu za 5"
                className="hidden sm:flex size-14 rounded-full shrink-0 text-lg font-bold"
                onClick={() =>
                  field.onChange(
                    Math.min(MAX_SHOPPING_LIST_ITEM_AMOUNT, field.value + 5),
                  )
                }
                disabled={field.value >= MAX_SHOPPING_LIST_ITEM_AMOUNT}
              >
                +5
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
