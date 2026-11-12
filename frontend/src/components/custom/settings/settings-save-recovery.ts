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

/** Keeps what is on screen, as a field edited while the save ran must not snap back to the value sent. */
export function rebaselineKeepingEdits(
  form: UseFormReturn<SettingsFormValues>,
  saved: Partial<SettingsFormValues>,
  flushDraft: (baseline: Partial<SettingsFormValues>) => void,
) {
  const baseline = {
    ...form.formState.defaultValues,
    ...saved,
  } as SettingsFormValues;
  form.reset(baseline, { keepValues: true });

  // A reset that keeps values emits no change, so the draft is rewritten here against the new baseline.
  flushDraft(baseline);
}

export function rebaselineSavedSections(
  form: UseFormReturn<SettingsFormValues>,
  jobs: ISaveJob[],
  results: PromiseSettledResult<void>[],
  values: SettingsFormValues,
  onSaved: () => void,
  flushDraft: (baseline: Partial<SettingsFormValues>) => void,
) {
  const saved: Partial<SettingsFormValues> = {};

  jobs.forEach((job, index) => {
    if (results[index].status !== "fulfilled") return;

    for (const field of JOB_FIELDS[job.key]) {
      Object.assign(saved, { [field]: values[field] });
    }

    if (job.key === "avatar") onSaved();
  });

  // Nothing saved leaves the form as it was, errors and touched fields of untouched sections included.
  if (Object.keys(saved).length > 0)
    rebaselineKeepingEdits(form, saved, flushDraft);
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
