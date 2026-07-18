"use client";

import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useModalUrl } from "@/lib/modal/use-modal-url";
import type { SettingsTab } from "@/lib/modal/modal-registry";
import { useUser } from "@/context/user-context";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  SETTINGS_DRAFT_KEY,
  SettingsFormValues,
  settingsFormSchema,
} from "@/components/custom/settings/settings-schema";
import { useSettingsDefaults } from "@/components/custom/settings/use-settings-defaults";
import { useSettingsSave } from "@/components/custom/settings/use-settings-save";
import { SettingsUiProvider } from "@/components/custom/settings/settings-context";
import { SettingsModal } from "@/components/custom/settings/settings-modal";

interface AvatarState {
  initialized: boolean;
  preview: string | null;
  touched: boolean;
}

/**
 * Permanently mounted (for authenticated users) so the one settings form
 * outlives the closed dialog: optimistic-close saves keep running, and a
 * failed section can reopen the modal with its state and errors intact.
 */
export default function SettingsModalHost() {
  const { target } = useModalUrl();
  const { user } = useUser();
  const { defaults, isReady } = useSettingsDefaults();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: defaults,
  });

  const [avatar, setAvatar] = useState<AvatarState>({
    initialized: false,
    preview: null,
    touched: false,
  });

  // Adjust-during-render: seed the avatar from the loaded user exactly once.
  if (isReady && !avatar.initialized) {
    setAvatar({ initialized: true, preview: user?.image ?? null, touched: false });
  }

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!isReady || initializedRef.current) return;
    initializedRef.current = true;
    form.reset(defaults);
  }, [isReady, defaults, form]);

  const { restored, clearDraft } = useFormDraft({
    draftKey: SETTINGS_DRAFT_KEY,
    form,
    enabled: isReady,
  });

  const { save, saving } = useSettingsSave({
    form,
    avatarPreview: avatar.preview,
    avatarTouched: avatar.touched,
    onSaved: () => setAvatar((state) => ({ ...state, touched: false })),
    clearDraft,
  });

  function resetToDefaults() {
    clearDraft();
    form.reset(defaults);
    setAvatar({
      initialized: true,
      preview: user?.image ?? null,
      touched: false,
    });
  }

  const open = target?.name === "settings";

  // Keep the last tab rendered while closing so the exit animation doesn't
  // flash a different tab's content.
  const [lastTab, setLastTab] = useState<SettingsTab>("profil");
  if (target?.name === "settings" && target.tab !== lastTab) {
    setLastTab(target.tab);
  }

  return (
    <FormProvider {...form}>
      <SettingsUiProvider
        value={{
          isReady,
          saving,
          restored,
          avatarPreview: avatar.preview,
          avatarTouched: avatar.touched,
          updateAvatar: (preview) =>
            setAvatar((state) => ({ ...state, preview, touched: true })),
          save: () => {
            void save();
          },
          resetToDefaults,
        }}
      >
        <SettingsModal open={open} tab={lastTab} />
      </SettingsUiProvider>
    </FormProvider>
  );
}
