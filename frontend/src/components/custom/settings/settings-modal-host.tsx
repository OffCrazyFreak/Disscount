"use client";

import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useModalUrl } from "@/lib/modal/use-modal-url";
import { useUser } from "@/context/user-context";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  SETTINGS_DRAFT_KEY,
  SettingsFormValues,
  settingsFormSchema,
} from "@/components/custom/settings/settings-schema";
import { useSettingsDefaults } from "@/components/custom/settings/hooks/use-settings-defaults";
import { useLastSettingsTarget } from "@/components/custom/settings/hooks/use-last-settings-target";
import { useSettingsSave } from "@/components/custom/settings/hooks/use-settings-save";
import { useAvatarDraft } from "@/components/custom/settings/hooks/use-avatar-draft";
import SettingsUiProvider from "@/components/custom/settings/settings-context";
import SettingsModal from "@/components/custom/settings/settings-modal";
import OnboardingWizard from "@/components/custom/settings/onboarding/onboarding-wizard";
import { useSecuritySettings } from "@/components/custom/settings/security/hooks/use-security-settings";
import SecurityProvider from "@/components/custom/settings/security/security-context";

/** Always mounted so optimistic saves keep running and a failed section reopens with its state. */
export default function SettingsModalHost() {
  const { target } = useModalUrl();
  const { user } = useUser();
  const { defaults, isReady } = useSettingsDefaults();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: defaults,
  });

  const avatar = useAvatarDraft(isReady, user?.image ?? null);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!isReady || initializedRef.current) return;
    initializedRef.current = true;
    form.reset(defaults);
  }, [isReady, defaults, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey: SETTINGS_DRAFT_KEY,
    form,
    enabled: isReady,
  });

  const { saveSettings, saveOnboarding, saving } = useSettingsSave({
    form,
    avatar: avatar.change,
    onSaved: avatar.markSaved,
    clearDraft,
    flushDraft,
  });

  function resetToDefaults() {
    clearDraft();
    form.reset(defaults);
    avatar.reset();
  }

  const open = target?.name === "settings";

  const { lastTab, lastOnboardingMode } = useLastSettingsTarget(target);

  // The security tab's form/data lives here so the shared footer can drive it.
  const security = useSecuritySettings(open && lastTab === "sigurnost");

  return (
    <FormProvider {...form}>
      <SettingsUiProvider
        value={{
          isReady,
          saving,
          restored,
          avatarPreview: avatar.preview,
          avatarTouched: avatar.touched,
          updateAvatar: avatar.select,
          save: () => {
            void saveSettings();
          },
          resetToDefaults,
        }}
      >
        <SecurityProvider value={security}>
          <SettingsModal open={open} tab={lastTab} />
        </SecurityProvider>

        <OnboardingWizard
          open={target?.name === "onboarding"}
          mode={lastOnboardingMode}
          save={saveOnboarding}
          saving={saving}
        />
      </SettingsUiProvider>
    </FormProvider>
  );
}
