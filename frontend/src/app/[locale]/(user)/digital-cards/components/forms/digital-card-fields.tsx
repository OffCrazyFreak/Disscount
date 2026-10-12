"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import DigitalCardSelectField from "@/app/[locale]/(user)/digital-cards/components/forms/digital-card-select-field";
import type { DigitalCardRequest } from "@/lib/api/types";

const CARD_TYPES = [
  { value: "loyalty", labelKey: "cardTypes.loyalty" },
  { value: "discount", labelKey: "cardTypes.discount" },
  { value: "membership", labelKey: "cardTypes.membership" },
  { value: "gift", labelKey: "cardTypes.gift" },
  { value: "other", labelKey: "cardTypes.other" },
] as const;

const CODE_TYPES = [
  { value: "barcode", labelKey: "codeTypes.barcode" },
  { value: "qr", labelKey: "codeTypes.qr" },
  { value: "number", labelKey: "codeTypes.number" },
  { value: "text", labelKey: "codeTypes.text" },
] as const;

export default function DigitalCardFields() {
  const t = useTranslations("digitalCards");
  const form = useFormContext<DigitalCardRequest>();

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.title")}</FormLabel>
            <FormControl>
              <Input {...field} autoFocus />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.value")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <DigitalCardSelectField
        name="type"
        label={t("fields.type")}
        placeholder={t("fields.typePlaceholder")}
        options={CARD_TYPES.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
      />

      <DigitalCardSelectField
        name="codeType"
        label={t("fields.codeType")}
        placeholder={t("fields.codeTypePlaceholder")}
        options={CODE_TYPES.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.color")}</FormLabel>
            <FormControl>
              <Input
                type="color"
                {...field}
                value={field.value || "#ffffff"}
                className="h-16"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.note")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("fields.notePlaceholder")}
                {...field}
                value={field.value || ""}
                maxLength={200}
              />
            </FormControl>
            <FormDescription>
              {t("fields.noteHelp", {
                remaining: 200 - (field.value?.length || 0),
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
