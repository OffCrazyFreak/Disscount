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
  field: UseFormReturn<AddToListFormData>;
}

export default function MarkAsCheckedCheckbox({
  field,
}: IMarkAsCheckedCheckboxProps) {
  return (
    <FormField
      control={field.control}
      name="isChecked"
      render={({ field }) => (
        <FormItem className="flex items-center gap-4 ">
          <FormControl className="shadow-md cursor-pointer">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>

          <div>
            <FormLabel className="cursor-pointer mb-1">
              Unaprijed označi proizvod kao kupljen
            </FormLabel>
            <FormDescription className="text-xs text-gray-500">
              Ovo je moguće naknadno izmjeniti u popisu za kupnju
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
