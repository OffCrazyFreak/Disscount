import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { AddToListFormData } from "@/app/products/typings/add-to-list";

interface IMarkAsCheckedCheckboxProps {
  formField: UseFormReturn<AddToListFormData>;
}

export default function MarkAsCheckedCheckbox({
  formField,
}: IMarkAsCheckedCheckboxProps) {
  const t = useTranslations("addToList");

  return (
    <FormField
      control={formField.control}
      name="isChecked"
      render={({ field }) => (
        <FormItem className="flex items-center gap-4 ">
          <FormControl className="shadow-md cursor-pointer">
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(!!v)}
            />
          </FormControl>

          <div>
            <FormLabel className="cursor-pointer mb-1">
              {t("markCheckedLabel")}
            </FormLabel>
            <FormDescription className="text-xs text-gray-500">
              {t("markCheckedHint")}
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
