import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

interface IPasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  autoComplete: string;
  hasError?: boolean;
}

export default function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete,
  hasError,
}: IPasswordFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <PasswordInput
              {...field}
              placeholder="••••••••"
              autoComplete={autoComplete}
              className={cn(hasError && "border-red-700")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
