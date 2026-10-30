import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/custom/form/password-input";
import { cn } from "@/lib/utils";

interface IPasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  autoComplete: string;
  hasError?: boolean;
  // Sits on the label row, so a recovery link never pushes the input down.
  action?: ReactNode;
  description?: string;
}

export default function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete,
  hasError,
  action,
  description,
}: IPasswordFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between gap-2">
            <FormLabel>{label}</FormLabel>
            {action}
          </div>
          <FormControl>
            <PasswordInput
              {...field}
              placeholder="••••••••"
              autoComplete={autoComplete}
              className={cn(hasError && "border-red-700")}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
