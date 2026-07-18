"use client";

import { useFormContext } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";

type SwitchFieldName =
  | "notificationsPush"
  | "notificationsEmail"
  | "newsletter"
  | "feedbackContact";

interface NotificationSwitchRowProps {
  name: SwitchFieldName;
  label: string;
  description: string;
}

export function NotificationSwitchRow({
  name,
  label,
  description,
}: NotificationSwitchRowProps) {
  const form = useFormContext<SettingsFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-0">
          <SettingRow
            label={label}
            description={description}
            control={
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            }
          />
        </FormItem>
      )}
    />
  );
}
