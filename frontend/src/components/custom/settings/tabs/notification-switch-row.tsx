"use client";

import { useFormContext } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";

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
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
