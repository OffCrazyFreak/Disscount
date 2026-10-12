"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeLocale } from "@/components/custom/locale/use-change-locale";
import { useSettingsUi } from "@/components/custom/settings/settings-context";
import { dirtySections } from "@/components/custom/settings/settings-dirty";
import type { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { useSecurity } from "@/components/custom/settings/security/security-context";
import { isLocale, LOCALE_NAMES, LOCALES } from "@/i18n/locales";

export default function LanguageSelect() {
  const t = useTranslations("settings.preferences.language");
  const locale = useLocale();
  const { changeLocale, isPending } = useChangeLocale();
  const hintId = useId();

  const form = useFormContext<SettingsFormValues>();
  const { avatarTouched } = useSettingsUi();
  const security = useSecurity();
  const values = useWatch({ control: form.control });
  const { defaultValues } = useFormState({ control: form.control });
  const { isDirty: securityDirty } = useFormState({
    control: security.form.control,
  });

  // Switching language remounts the whole tree under the new [locale] segment, which
  // would silently drop unsaved edits.
  const locked =
    securityDirty ||
    dirtySections(
      values,
      (defaultValues ?? {}) as Partial<SettingsFormValues>,
      avatarTouched,
    ).size > 0;

  function handleChange(value: string) {
    if (isLocale(value) && value !== locale) changeLocale(value);
  }

  return (
    <div className="space-y-2">
      <Select
        value={locale}
        onValueChange={handleChange}
        disabled={locked || isPending}
      >
        <SelectTrigger
          className="w-full sm:w-64"
          aria-label={t("label")}
          aria-describedby={locked ? hintId : undefined}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {LOCALES.map((option) => (
            <SelectItem key={option} value={option} lang={option}>
              {LOCALE_NAMES[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {locked && (
        <p id={hintId} role="status" className="text-xs text-muted-foreground">
          {t("locked")}
        </p>
      )}
    </div>
  );
}
