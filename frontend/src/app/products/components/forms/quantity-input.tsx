import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface IQuantityInputProps {
  field: any;
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
