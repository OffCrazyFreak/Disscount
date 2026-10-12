"use client";

import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  UserRound,
  Bell,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";
import type { SettingsTab } from "@/lib/modal/modal-registry";
import useSwipeHorizontal from "@/hooks/use-swipe-horizontal";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { dirtySections } from "@/components/custom/settings/settings-dirty";
import { useSettingsUi } from "@/components/custom/settings/settings-context";
import { useSecurity } from "@/components/custom/settings/security/security-context";
import { CREDENTIALS_FORM_ID } from "@/components/custom/settings/security/components/credentials-form";
import ProfileTab from "@/components/custom/settings/tabs/profile-tab";
import NotificationsTab from "@/components/custom/settings/tabs/notifications-tab";
import PreferencesTab from "@/components/custom/settings/tabs/preferences-tab";
import SecurityTab from "@/components/custom/settings/tabs/security-tab";

const TAB_CONFIG = [
  { value: "profil", labelKey: "tabs.profile", icon: UserRound },
  { value: "obavijesti", labelKey: "tabs.notifications", icon: Bell },
  { value: "preference", labelKey: "tabs.preferences", icon: Settings2 },
  { value: "sigurnost", labelKey: "tabs.security", icon: ShieldCheck },
] as const satisfies readonly {
  value: SettingsTab;
  labelKey: string;
  icon: LucideIcon;
}[];

interface ISettingsModalProps {
  open: boolean;
  tab: SettingsTab;
}

export default function SettingsModal({ open, tab }: ISettingsModalProps) {
  const t = useTranslations("settings");
  const form = useFormContext<SettingsFormValues>();
  const { isReady, saving, avatarTouched, save, resetToDefaults } =
    useSettingsUi();
  const security = useSecurity();

  const values = useWatch({ control: form.control });
  const { defaultValues, errors } = useFormState({ control: form.control });
  const defaults = (defaultValues ?? {}) as Partial<SettingsFormValues>;
  // Destructured so every flag is read each render: RHF only computes the ones read.
  const {
    isDirty: securityDirty,
    isValid: securityValid,
    isSubmitting: securitySubmitting,
  } = useFormState({ control: security.form.control });
  const dirty = dirtySections(values, defaults, avatarTouched);
  const anyDirty = dirty.size > 0;

  const isSecurityTab = tab === "sigurnost";

  // Clamped at both ends, so a swipe past the last tab is a no-op rather than a wrap.
  function stepTab(offset: number) {
    const index = TAB_CONFIG.findIndex(({ value }) => value === tab) + offset;
    const next = TAB_CONFIG[index];
    if (next) swapModalUrl({ name: "settings", tab: next.value });
  }

  const swipe = useSwipeHorizontal({
    onSwipeLeft: () => stepTab(1),
    onSwipeRight: () => stepTab(-1),
  });

  // The security tab drives its own credentials form through the shared footer.
  const securityFooter = {
    dirty: securityDirty,
    formId: CREDENTIALS_FORM_ID,
    submitLabel: t("modal.save"),
    submitLoading: securitySubmitting,
    submitDisabled: !securityDirty || !securityValid,
    resetLabel: t("modal.reset"),
    resetDisabled: !securityDirty,
    onReset: () => security.form.reset(),
  };

  const settingsFooter = {
    dirty: anyDirty,
    formId: "settings-form",
    submitLabel: t("modal.save"),
    submitLoading: saving,
    submitDisabled: !anyDirty || !isReady,
    resetLabel: t("modal.reset"),
    resetDisabled: !anyDirty,
    onReset: resetToDefaults,
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("modal.title")}
      description={t("modal.description")}
      srOnlyDescription
      cancelLabel={t("modal.cancel")}
      caption={
        <button
          type="button"
          onClick={() => swapModalUrl({ name: "onboarding", mode: "replay" })}
          className="cursor-pointer underline hover:text-primary"
        >
          {t("modal.replayGuide")}
        </button>
      }
      {...(isSecurityTab ? securityFooter : settingsFooter)}
    >
      {errors.root && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) =>
          swapModalUrl({ name: "settings", tab: value as SettingsTab })
        }
        {...swipe}
      >
        <TabsList className="w-full mb-4">
          {TAB_CONFIG.map(({ value, labelKey, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="relative gap-1.5">
              <Icon className="size-5" />
              <span className="hidden sm:inline">{t(labelKey)}</span>
              {value !== "sigurnost" && dirty.has(value) && (
                <span
                  aria-label={t("modal.unsavedChanges")}
                  className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <form
          id="settings-form"
          onSubmit={form.handleSubmit(() => {
            void save();
          })}
        >
          <TabsContent value="profil">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="obavijesti">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="preference">
            <PreferencesTab />
          </TabsContent>
        </form>

        {/* Sigurnost's credentials form lives in SecurityTab (via the security
            context) and is submitted by the shared footer through its formId. */}
        <TabsContent value="sigurnost">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </ModalShell>
  );
}
