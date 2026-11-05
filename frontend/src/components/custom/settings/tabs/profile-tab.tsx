"use client";

import { useFormContext } from "react-hook-form";
import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { acquisitionChannelSchema } from "@/lib/api/schemas/auth-user";
import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import AvatarField from "@/components/custom/settings/components/avatar-field";

export default function ProfileTab() {
  const t = useTranslations("settings");
  const form = useFormContext<SettingsFormValues>();

  return (
    <SettingsSection icon={UserRound} label={t("tabs.profile")}>
      <StaggerChildren className="space-y-6">
        <AvatarField />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.username.label")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              {/* Says it is taken up front, so a rejection on save is not a surprise.
                  The server has the last word and answers 409, which lands on this
                  field through problem-details. */}
              <FormDescription>
                {t("profile.username.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acquisitionChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.acquisition.label")}</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("profile.acquisition.placeholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {acquisitionChannelSchema.options.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`profile.channels.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t("profile.acquisition.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </StaggerChildren>
    </SettingsSection>
  );
}
