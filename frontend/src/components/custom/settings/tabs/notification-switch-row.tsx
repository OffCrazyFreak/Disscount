"use client";

import { useFormContext } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { ComingSoonBadge } from "@/components/custom/coming-soon-badge";

type SwitchFieldName =
  | "notificationsPush"
  | "notificationsEmail"
  | "newsletter"
  | "feedbackContact";

interface NotificationSwitchRowProps {
  name: SwitchFieldName;
  label: string;
  description: string;
  comingSoon?: boolean;
}

export function NotificationSwitchRow({
  name,
  label,
  description,
  comingSoon = false,
}: NotificationSwitchRowProps) {
  const form = useFormContext<SettingsFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-0 py-2">
          <SettingRow
            label={
              <span className="flex items-center gap-2">
                {label}
                {comingSoon && <ComingSoonBadge />}
              </span>
            }
            description={description}
            control={
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={comingSoon}
                />
              </FormControl>
            }
          />
        </FormItem>
      )}
    />
  );
}
