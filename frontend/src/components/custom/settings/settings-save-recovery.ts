import type { UseFormReturn } from "react-hook-form";

import { applyProblemToForm } from "@/lib/api/problem-details";
import {
  SettingsFormValues,
  SettingsSection,
} from "@/components/custom/settings/settings-schema";
import {
  ISaveJob,
  SaveJobKey,
  USER_FIELDS,
} from "@/components/custom/settings/settings-save-jobs";

const JOB_FIELDS: Record<SaveJobKey, (keyof SettingsFormValues)[]> = {
  user: USER_FIELDS,
  stores: ["pinnedStores"],
  places: ["pinnedPlaces"],
};

const JOB_ERRORS: Record<SaveJobKey, string> = {
  user: "Greška pri spremanju profila.",
  stores: "Greška pri spremanju trgovina.",
  places: "Greška pri spremanju lokacija.",
};

// Re-baselines the sections that saved, so only the failed ones stay dirty.
export function rebaselineSavedSections(
  form: UseFormReturn<SettingsFormValues>,
  jobs: ISaveJob[],
  results: PromiseSettledResult<void>[],
  values: SettingsFormValues,
  onSaved: () => void,
) {
  jobs.forEach((job, index) => {
    if (results[index].status !== "fulfilled") return;

    for (const field of JOB_FIELDS[job.key]) {
      form.resetField(field, { defaultValue: values[field] });
    }

    if (job.key === "user") onSaved();
  });
}

export function applySaveErrors(
  form: UseFormReturn<SettingsFormValues>,
  jobs: ISaveJob[],
  results: PromiseSettledResult<void>[],
) {
  jobs.forEach((job, index) => {
    const result = results[index];
    if (result.status !== "rejected") return;

    applyProblemToForm(result.reason, form, undefined, JOB_ERRORS[job.key]);
  });
}

export function failedSaveTab(
  key: SaveJobKey,
  dirty: Set<SettingsSection>,
): SettingsSection {
  if (key !== "user") return "preference";

  return dirty.has("profil") ? "profil" : "obavijesti";
}
