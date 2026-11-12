import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StepperNumberInput } from "@/components/custom/form/stepper-number-input";
import { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

interface IQuantityInputProps {
  formField: UseFormReturn<AddToListFormData>;
}

export default function QuantityInput({ formField }: IQuantityInputProps) {
  const t = useTranslations("products");

  return (
    <FormField
      control={formField.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("quantity.label")}</FormLabel>
          <FormControl>
            <StepperNumberInput
              value={field.value}
              onChange={field.onChange}
              steps={{ primary: 1, secondary: 5 }}
              min={1}
              max={MAX_SHOPPING_LIST_ITEM_AMOUNT}
              integer
              ariaLabel={t("quantity.label")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
