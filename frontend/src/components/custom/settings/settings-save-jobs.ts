import {
  ONBOARDING_COMPLETED,
  type UserRequest,
} from "@/lib/api/schemas/auth-user";
import {
  SECTION_FIELDS,
  SettingsFormValues,
  type SettingsSection,
} from "@/components/custom/settings/settings-schema";
import { fieldChanged } from "@/components/custom/settings/settings-dirty";

export type SaveJobKey = "user" | "stores" | "places";

export interface ISaveJob {
  key: SaveJobKey;
  run: () => Promise<void>;
}

export interface ISaveJobRunners {
  saveUser: (patch: UserRequest) => Promise<void>;
  saveStores: (chainCodes: string[]) => Promise<void>;
  savePlaces: (placeNames: string[]) => Promise<void>;
}

export const USER_FIELDS = [
  ...SECTION_FIELDS.profil,
  ...SECTION_FIELDS.obavijesti,
];

export function buildUserPatch(
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  avatar: { touched: boolean; preview: string | null },
  extraUserPatch?: Partial<UserRequest>,
): UserRequest {
  const patch: UserRequest = { ...extraUserPatch };

  for (const field of USER_FIELDS) {
    if (fieldChanged(values, defaults, field)) {
      Object.assign(patch, { [field]: values[field] });
    }
  }

  if (avatar.touched) patch.image = avatar.preview ?? "";

  return patch;
}

export type SaveMode = "settings" | "onboarding";

/** The user PATCH for a save, or null when nothing on the user needs writing. */
export function buildModeUserPatch(
  mode: SaveMode,
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  dirty: Set<SettingsSection>,
  avatar: { touched: boolean; preview: string | null },
): UserRequest | null {
  // Onboarding stamps its outcome in the same patch as the profile fields, so
  // only one user PATCH runs. A second, later call would land after the pinned
  // stores and places jobs and, response by response, undo them.
  if (mode === "onboarding") {
    return buildUserPatch(values, defaults, avatar, {
      onboardingOutcome: ONBOARDING_COMPLETED,
    });
  }

  const userDirty = dirty.has("profil") || dirty.has("obavijesti");

  return userDirty ? buildUserPatch(values, defaults, avatar) : null;
}

// One job per persistence target, so a failure in one still leaves the others saved.
export function buildSaveJobs(
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  userPatch: UserRequest | null,
  runners: ISaveJobRunners,
): ISaveJob[] {
  const jobs: ISaveJob[] = [];

  if (userPatch) {
    jobs.push({ key: "user", run: () => runners.saveUser(userPatch) });
  }

  if (fieldChanged(values, defaults, "pinnedStores")) {
    jobs.push({
      key: "stores",
      run: () => runners.saveStores(values.pinnedStores),
    });
  }

  if (fieldChanged(values, defaults, "pinnedPlaces")) {
    jobs.push({
      key: "places",
      run: () => runners.savePlaces(values.pinnedPlaces),
    });
  }

  return jobs;
}
