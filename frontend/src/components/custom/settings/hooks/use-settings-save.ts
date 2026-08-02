"use client";

import { onlineManager } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
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

    // Onboarding stamps its outcome in the same patch as the profile fields, so
    // only one user PATCH runs. A second, later call would land after the pinned
    // stores and places jobs and, response by response, undo them.
    const completion = mode === "onboarding" ? ONBOARDING_COMPLETED : undefined;

    const jobs = buildSaveJobs(
      values,
      defaults,
      userDirty || completion
        ? buildUserPatch(
            values,
            defaults,
            { touched: avatarTouched, preview: avatarPreview },
            completion ? { onboardingOutcome: completion } : undefined,
          )
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

    clearDraft();
    form.reset(values);
    onSaved();
    // Onboarding always runs a job to stamp its outcome, so only a settings save
    // can reach here with nothing written, and claiming otherwise would be a lie.
    if (mode === "onboarding") {
      toast.success("Sve je spremno!");
      closeModalUrl();
    } else {
      toast.success("Postavke su spremljene!");
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
