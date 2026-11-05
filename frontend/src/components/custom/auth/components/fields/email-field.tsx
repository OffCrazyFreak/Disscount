import { useTranslations } from "next-intl";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface IEmailFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

export default function EmailField<T extends FieldValues>({
  control,
  name,
}: IEmailFieldProps<T>) {
  const t = useTranslations("auth");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("email.label")}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="email"
              placeholder={t("email.placeholder")}
              autoComplete="email"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
