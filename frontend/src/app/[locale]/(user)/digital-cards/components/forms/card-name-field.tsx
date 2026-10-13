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
import { Input } from "@/components/ui/input";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CardNameField() {
  const t = useTranslations("digitalCards.form");
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name="cardName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("cardNameLabel")}</FormLabel>
          <FormControl>
            <Input {...field} autoFocus autoComplete="off" maxLength={60} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
