"use client";

import { onlineManager } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { UserRequest } from "@/lib/api/schemas/auth-user";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { dirtySections } from "@/components/custom/settings/settings-dirty";
import {
  buildSaveJobs,
  buildUserPatch,
} from "@/components/custom/settings/settings-save-jobs";
import {
  applySaveErrors,
  failedSaveTab,
  rebaselineSavedSections,
} from "@/components/custom/settings/settings-save-recovery";
import { useSettingsSaveRunners } from "@/components/custom/settings/hooks/use-settings-save-runners";

interface IUseSettingsSaveProps {
  form: UseFormReturn<SettingsFormValues>;
  avatarPreview: string | null;
  avatarTouched: boolean;
  onSaved: () => void;
  clearDraft: () => void;
}

export function useSettingsSave({
  form,
  avatarPreview,
  avatarTouched,
  onSaved,
  clearDraft,
}: IUseSettingsSaveProps) {
  const { runners, saving } = useSettingsSaveRunners();

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function save(extraUserPatch?: Partial<UserRequest>): Promise<boolean> {
    const values = form.getValues();
    const defaults = (form.formState.defaultValues ??
      {}) as Partial<SettingsFormValues>;
    const dirty = dirtySections(values, defaults, avatarTouched);

    closeModalUrl();
    if (dirty.size === 0 && !extraUserPatch) return true;

    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan si mreže - promjene će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    const userDirty =
      dirty.has("profil") || dirty.has("obavijesti") || !!extraUserPatch;

    const jobs = buildSaveJobs(
      values,
      defaults,
      userDirty
        ? buildUserPatch(
            values,
            defaults,
            { touched: avatarTouched, preview: avatarPreview },
            extraUserPatch,
          )
        : null,
      runners,
    );

    const results = await Promise.allSettled(jobs.map((job) => job.run()));
    const failed = jobs.filter(
      (_, index) => results[index].status === "rejected",
    );

    if (failed.length === 0) {
      clearDraft();
      form.reset(values);
      onSaved();
      toast.success("Postavke su spremljene!");
      return true;
    }

    rebaselineSavedSections(form, jobs, results, values, onSaved);
    openModalUrl({
      name: "settings",
      tab: failedSaveTab(failed[0].key, dirty),
    });
    applySaveErrors(form, jobs, results);

    return false;
  }

  return { save, saving };
}
