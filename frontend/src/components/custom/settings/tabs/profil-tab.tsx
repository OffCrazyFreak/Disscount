"use client";

import { useFormContext } from "react-hook-form";
import { UserRound } from "lucide-react";

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
import { ACQUISITION_CHANNEL_LABELS } from "@/lib/api/schemas/auth-user";
import { StaggerChildren } from "@/components/ui/stagger-children";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { AvatarField } from "@/components/custom/settings/tabs/avatar-field";

export function ProfilTab() {
  const form = useFormContext<SettingsFormValues>();

  return (
    <SettingsSection icon={UserRound} label="Profil">
      <StaggerChildren className="space-y-6">
        <AvatarField />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Korisničko ime</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>Kako ćemo te zvati?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acquisitionChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kako si saznao za Disscount?</FormLabel>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Odaberi izvor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ACQUISITION_CHANNEL_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Pomaže nam da znamo gdje te možemo bolje pronaći.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </StaggerChildren>
    </SettingsSection>
  );
}
