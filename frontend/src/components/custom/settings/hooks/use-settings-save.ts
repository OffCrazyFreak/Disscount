"use client";

import { onlineManager } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

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

  async function save(mode: "settings" | "onboarding"): Promise<boolean> {
    const values = form.getValues();
    const defaults = (form.formState.defaultValues ??
      {}) as Partial<SettingsFormValues>;
    const dirty = dirtySections(values, defaults, avatarTouched);

    if (mode === "settings") closeModalUrl();
    if (mode === "settings" && dirty.size === 0) return true;

    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan si mreže - promjene će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    const userDirty = dirty.has("profil") || dirty.has("obavijesti");

    const jobs = buildSaveJobs(
      values,
      defaults,
      userDirty
        ? buildUserPatch(values, defaults, {
            touched: avatarTouched,
            preview: avatarPreview,
          })
        : null,
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
      applySaveErrors(form, jobs, results);

      return false;
    }

    if (mode === "onboarding") {
      const completionJobs = [
        {
          key: "user" as const,
          run: () => runners.saveUser({ onboardingOutcome: "completed" }),
        },
      ];
      const completionResults = await Promise.allSettled([
        completionJobs[0].run(),
      ]);

      if (completionResults[0].status === "rejected") {
        rebaselineSavedSections(form, jobs, results, values, onSaved);
        applySaveErrors(form, completionJobs, completionResults);

        return false;
      }
    }

    clearDraft();
    form.reset(values);
    onSaved();
    toast.success("Postavke su spremljene!");
    if (mode === "onboarding") closeModalUrl();

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
