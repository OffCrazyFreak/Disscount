import {
  ONBOARDING_COMPLETED,
  type UserRequest,
} from "@/lib/api/schemas/auth-user";
import {
  SECTION_FIELDS,
  SettingsFormValues,
} from "@/components/custom/settings/settings-schema";
import { fieldChanged } from "@/components/custom/settings/settings-dirty";

export type SaveJobKey = "user" | "avatar" | "stores" | "places";

export interface ISaveJob {
  key: SaveJobKey;
  run: () => Promise<void>;
}

/** What the avatar field holds: a new image to upload, or null to remove the current one. */
export interface IAvatarChange {
  touched: boolean;
  upload: Blob | null;
}

export interface ISaveJobRunners {
  saveUser: (patch: UserRequest) => Promise<void>;
  uploadAvatar: (avatar: Blob) => Promise<void>;
  removeAvatar: () => Promise<void>;
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
  extraUserPatch?: Partial<UserRequest>,
): UserRequest {
  const patch: UserRequest = { ...extraUserPatch };

  for (const field of USER_FIELDS) {
    if (fieldChanged(values, defaults, field)) {
      Object.assign(patch, { [field]: values[field] });
    }
  }

  return patch;
}

export type SaveMode = "settings" | "onboarding";

export function buildModeUserPatch(
  mode: SaveMode,
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
): UserRequest | null {
  // Same patch as the profile fields, because a second, later PATCH would land after the pinned jobs and undo them.
  if (mode === "onboarding") {
    return buildUserPatch(values, defaults, {
      onboardingOutcome: ONBOARDING_COMPLETED,
    });
  }

  const patch = buildUserPatch(values, defaults);

  // An avatar-only change marks the profile dirty too, and goes through its own job.
  return Object.keys(patch).length > 0 ? patch : null;
}

// One job per persistence target, so a failure in one still leaves the others saved.
export function buildSaveJobs(
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  userPatch: UserRequest | null,
  avatar: IAvatarChange,
  runners: ISaveJobRunners,
): ISaveJob[] {
  const jobs: ISaveJob[] = [];

  if (userPatch) {
    jobs.push({ key: "user", run: () => runners.saveUser(userPatch) });
  }

  // Its own endpoint, as a multipart upload cannot ride in the JSON profile patch.
  if (avatar.touched) {
    const { upload } = avatar;

    jobs.push({
      key: "avatar",
      run: () =>
        upload ? runners.uploadAvatar(upload) : runners.removeAvatar(),
    });
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
