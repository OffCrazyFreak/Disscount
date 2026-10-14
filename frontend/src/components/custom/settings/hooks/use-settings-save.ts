"use client";

import { onlineManager } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { dirtySections } from "@/components/custom/settings/settings-dirty";
import {
  buildModeUserPatch,
  buildSaveJobs,
  type SaveMode,
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
  const t = useTranslations("settings");
  const { runners, saving } = useSettingsSaveRunners();

  async function save(mode: SaveMode): Promise<boolean> {
    const values = form.getValues();
    const defaults = (form.formState.defaultValues ??
      {}) as Partial<SettingsFormValues>;
    const dirty = dirtySections(values, defaults, avatarTouched);

    if (mode === "settings") closeModalUrl();
    if (mode === "settings" && dirty.size === 0) return true;

    if (!onlineManager.isOnline()) {
      toast.info(t("save.offline"));
    }

    const jobs = buildSaveJobs(
      values,
      defaults,
      buildModeUserPatch(mode, values, defaults, dirty, {
        touched: avatarTouched,
        preview: avatarPreview,
      }),
      runners,
    );

    const results = await Promise.allSettled(jobs.map((job) => job.run()));
    const failed = jobs.filter(
      (_, index) => results[index].status === "rejected",
    );

    if (failed.length > 0) {
      rebaselineSavedSections(form, jobs, results, values, onSaved);
      if (mode === "settings") {
        openModalUrl({
          name: "settings",
          tab: failedSaveTab(failed[0].key, dirty),
        });
      }
      applySaveErrors(form, jobs, results, t);

      return false;
    }

    clearDraft();
    form.reset(values);
    onSaved();
    // Onboarding always runs a job to stamp its outcome, so only a settings save
    // can reach here with nothing written, and claiming otherwise would be a lie.
    if (mode === "onboarding") {
      toast.success(t("save.onboardingDone"));
      closeModalUrl();
    } else {
      toast.success(t("save.settingsSaved"));
    }

    return true;
  }

  function saveSettings(): Promise<boolean> {
    return save("settings");
  }

  function saveOnboarding(): Promise<boolean> {
    return save("onboarding");
  }

  return { saveSettings, saveOnboarding, saving };
}
