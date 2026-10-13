"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContactMessageRequest } from "@/lib/api/types";

const MESSAGE_MAX = 5000;

export default function ContactFormFields() {
  const t = useTranslations("common");
  const form = useFormContext<ContactMessageRequest>();

  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("contact.form.email")}</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder={t("contact.form.emailPlaceholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("contact.form.fullName")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("contact.form.fullNamePlaceholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("contact.form.subject")}{" "}
              <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t("contact.form.subjectPlaceholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("contact.form.message")}{" "}
              <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                maxLength={MESSAGE_MAX}
                placeholder={t("contact.form.messagePlaceholder")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              {t("contact.form.charactersLeft", {
                count: MESSAGE_MAX - (field.value?.length ?? 0),
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Honeypot: hidden from users; bot submissions that fill it are dropped. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        // eslint-disable-next-line i18next/no-literal-string -- field name, not copy
        {...form.register("honeypot")}
      />
    </>
  );
}
