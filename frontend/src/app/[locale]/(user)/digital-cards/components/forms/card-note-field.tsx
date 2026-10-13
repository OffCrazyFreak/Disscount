"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { DigitalCardRequest } from "@/lib/api/types";

const NOTE_MAX_LENGTH = 500;

export default function CardNoteField() {
  const t = useTranslations("digitalCards.form");
  const form = useFormContext<DigitalCardRequest>();

  return (
    <FormField
      control={form.control}
      name="note"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("noteLabel")}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              maxLength={NOTE_MAX_LENGTH}
              placeholder={t("notePlaceholder")}
            />
          </FormControl>
          <FormDescription>
            {t("noteRemaining", {
              count: NOTE_MAX_LENGTH - (field.value?.length ?? 0),
            })}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
