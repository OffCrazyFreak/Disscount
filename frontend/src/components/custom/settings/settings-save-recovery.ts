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
  avatar: [],
  stores: ["pinnedStores"],
  places: ["pinnedPlaces"],
};

type JobErrorKey =
  "save.errors.user" | "save.errors.stores" | "save.errors.places";

const JOB_ERRORS: Record<SaveJobKey, JobErrorKey> = {
  // The avatar is part of the profile on screen, so its failure reads the same.
  user: "save.errors.user",
  avatar: "save.errors.user",
  stores: "save.errors.stores",
  places: "save.errors.places",
};

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

    if (job.key === "avatar") onSaved();
  });
}

export function applySaveErrors(
  form: UseFormReturn<SettingsFormValues>,
  jobs: ISaveJob[],
  results: PromiseSettledResult<void>[],
  t: (key: JobErrorKey) => string,
) {
  jobs.forEach((job, index) => {
    const result = results[index];
    if (result.status !== "rejected") return;

    applyProblemToForm(result.reason, form, undefined, t(JOB_ERRORS[job.key]));
  });
}

export function failedSaveTab(
  key: SaveJobKey,
  dirty: Set<SettingsSection>,
): SettingsSection {
  if (key === "avatar") return "profil";
  if (key !== "user") return "preference";

  return dirty.has("profil") ? "profil" : "obavijesti";
}
