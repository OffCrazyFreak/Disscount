import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StepperNumberInput } from "@/components/custom/form/stepper-number-input";
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
            <StepperNumberInput
              value={field.value}
              onChange={field.onChange}
              steps={{ primary: 2, secondary: 5 }}
              min={1}
              max={MAX_SHOPPING_LIST_ITEM_AMOUNT}
              integer
              ariaLabel="Količina"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
