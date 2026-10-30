"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODE_TYPES, CODE_TYPE_LABEL_KEYS } from "@/constants/card-codes";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CodeTypeField() {
  const t = useTranslations();
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name="codeType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("digitalCards.form.codeTypeLabel")}</FormLabel>

          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("digitalCards.form.codeTypePlaceholder")}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CODE_TYPES.map((codeType) => (
                <SelectItem key={codeType} value={codeType}>
                  {t(CODE_TYPE_LABEL_KEYS[codeType])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
