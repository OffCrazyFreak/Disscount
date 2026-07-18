"use client";

import { onlineManager } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { userService, preferencesService } from "@/lib/api";
import type { UserRequest } from "@/lib/api/schemas/auth-user";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import {
  SECTION_FIELDS,
  SettingsFormValues,
} from "@/components/custom/settings/settings-schema";
import { dirtySections } from "@/components/custom/settings/settings-dirty";

interface IUseSettingsSaveProps {
  form: UseFormReturn<SettingsFormValues>;
  avatarPreview: string | null;
  avatarTouched: boolean;
  onSaved: () => void;
  clearDraft: () => void;
}

type SaveJobKey = "user" | "stores" | "places";

export function useSettingsSave({
  form,
  avatarPreview,
  avatarTouched,
  onSaved,
  clearDraft,
}: IUseSettingsSaveProps) {
  const { setUser, updatePinnedStores, updatePinnedPlaces } = useUser();

  const userMutation = userService.useUpdateCurrentUser();
  const storesMutation = preferencesService.useUpdatePinnedStores();
  const placesMutation = preferencesService.useUpdatePinnedPlaces();

  // Optimistic close: closes immediately, saves only the DIRTY sections in
  // parallel, and reopens on the first failed tab with errors mapped. Sections
  // that succeeded are re-baselined so they stay clean.
  async function save(extraUserPatch?: Partial<UserRequest>): Promise<boolean> {
    const values = form.getValues();
    const defaults = (form.formState.defaultValues ??
      {}) as Partial<SettingsFormValues>;
    const sections = dirtySections(values, defaults, avatarTouched);

    if (sections.size === 0 && !extraUserPatch) {
      closeModalUrl();
      return true;
    }

    closeModalUrl();

    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan ste mreže - promjene će se sinkronizirati kad se vratite na mrežu."
      );
    }

    const userDirty =
      sections.has("profil") || sections.has("obavijesti") || !!extraUserPatch;

    const jobs: { key: SaveJobKey; run: () => Promise<void> }[] = [];

    if (userDirty) {
      const patch: UserRequest = { ...extraUserPatch };
      for (const field of [...SECTION_FIELDS.profil, ...SECTION_FIELDS.obavijesti]) {
        if (JSON.stringify(values[field]) !== JSON.stringify(defaults[field])) {
          Object.assign(patch, { [field]: values[field] });
        }
      }
      if (avatarTouched) patch.image = avatarPreview ?? "";

      jobs.push({
        key: "user",
        run: async () => {
          const updated = await userMutation.mutateAsync(patch);
          setUser(updated);
        },
      });
    }

    if (
      JSON.stringify(values.pinnedStores) !==
      JSON.stringify(defaults.pinnedStores)
    ) {
      jobs.push({
        key: "stores",
        run: async () => {
          const stores = await storesMutation.mutateAsync({
            stores: values.pinnedStores.map((code) => ({
              storeApiId: code,
              storeName: code,
            })),
          });
          updatePinnedStores(stores);
        },
      });
    }

    if (
      JSON.stringify(values.pinnedPlaces) !==
      JSON.stringify(defaults.pinnedPlaces)
    ) {
      jobs.push({
        key: "places",
        run: async () => {
          const places = await placesMutation.mutateAsync({
            places: values.pinnedPlaces.map((placeName) => ({
              placeApiId: placeName,
              placeName,
            })),
          });
          updatePinnedPlaces(places);
        },
      });
    }

    const results = await Promise.allSettled(jobs.map((job) => job.run()));
    const failed = jobs.filter((_, i) => results[i].status === "rejected");

    if (failed.length === 0) {
      clearDraft();
      form.reset(values);
      onSaved();
      toast.success("Postavke su spremljene!");
      return true;
    }

    // Re-baseline the sections that DID save so they stop reading as dirty.
    for (const [index, job] of jobs.entries()) {
      if (results[index].status !== "fulfilled") continue;
      const fields =
        job.key === "user"
          ? [...SECTION_FIELDS.profil, ...SECTION_FIELDS.obavijesti]
          : job.key === "stores"
            ? ["pinnedStores" as const]
            : ["pinnedPlaces" as const];
      for (const field of fields) {
        form.resetField(field, { defaultValue: values[field] });
      }
      if (job.key === "user") onSaved();
    }

    const firstFailedKey = failed[0].key;
    const failTab =
      firstFailedKey === "user"
        ? sections.has("profil")
          ? "profil"
          : "obavijesti"
        : "preference";

    openModalUrl({ name: "settings", tab: failTab });

    for (const [index, job] of jobs.entries()) {
      const result = results[index];
      if (result.status === "rejected") {
        applyProblemToForm(result.reason, form.setError, undefined, {
          user: "Greška pri spremanju profila.",
          stores: "Greška pri spremanju trgovina.",
          places: "Greška pri spremanju lokacija.",
        }[job.key]);
      }
    }

    return false;
  }

  const saving =
    userMutation.isPending ||
    storesMutation.isPending ||
    placesMutation.isPending;

  return { save, saving };
}
