import type { UserRequest } from "@/lib/api/schemas/auth-user";
import {
  SECTION_FIELDS,
  SettingsFormValues,
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

// One job per dirty section, so a failure in any one leaves the others saved.
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
