"use client";

import { useFormContext } from "react-hook-form";
import {
  UserRound,
  Bell,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";
import type { SettingsTab } from "@/lib/modal/modal-registry";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";
import { dirtySections } from "@/components/custom/settings/settings-dirty";
import { useSettingsUi } from "@/components/custom/settings/settings-context";
import { useSecurity } from "@/components/custom/settings/tabs/security-context";
import { CREDENTIALS_FORM_ID } from "@/components/custom/header/forms/account-credentials-form";
import { ProfilTab } from "@/components/custom/settings/tabs/profil-tab";
import { ObavijestiTab } from "@/components/custom/settings/tabs/obavijesti-tab";
import { PreferenceTab } from "@/components/custom/settings/tabs/preference-tab";
import { SigurnostTab } from "@/components/custom/settings/tabs/sigurnost-tab";

const TAB_CONFIG: { value: SettingsTab; label: string; icon: LucideIcon }[] = [
  { value: "profil", label: "Profil", icon: UserRound },
  { value: "obavijesti", label: "Obavijesti", icon: Bell },
  { value: "preference", label: "Preference", icon: Settings2 },
  { value: "sigurnost", label: "Sigurnost", icon: ShieldCheck },
];

interface SettingsModalProps {
  open: boolean;
  tab: SettingsTab;
}

export function SettingsModal({ open, tab }: SettingsModalProps) {
  const form = useFormContext<SettingsFormValues>();
  const { isReady, saving, avatarTouched, save, resetToDefaults } =
    useSettingsUi();
  const security = useSecurity();

  const values = form.watch();
  const defaults = (form.formState.defaultValues ??
    {}) as Partial<SettingsFormValues>;
  const dirty = dirtySections(values, defaults, avatarTouched);
  const anyDirty = dirty.size > 0;

  const isSecurityTab = tab === "sigurnost";

  // The security tab drives its own credentials form through the shared footer.
  const securityFooter = {
    dirty: security.form.formState.isDirty,
    formId: CREDENTIALS_FORM_ID,
    submitLabel: "Spremi",
    submitLoading: security.form.formState.isSubmitting,
    submitDisabled:
      !security.form.formState.isDirty || !security.form.formState.isValid,
    resetLabel: security.form.formState.isDirty ? "Resetiraj" : undefined,
    onReset: () => security.form.reset(),
  };

  const settingsFooter = {
    dirty: anyDirty,
    formId: "settings-form",
    submitLabel: "Spremi",
    submitLoading: saving,
    submitDisabled: !anyDirty || !isReady,
    resetLabel: anyDirty ? "Resetiraj" : undefined,
    onReset: resetToDefaults,
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Postavke"
      description="Upravljaj profilom, obavijestima, preferencama i sigurnošću."
      srOnlyDescription
      cancelLabel="Odustani"
      caption={
        <button
          type="button"
          onClick={() => swapModalUrl({ name: "onboarding" })}
          className="cursor-pointer underline hover:text-primary"
        >
          Pokreni vodič ponovno
        </button>
      }
      {...(isSecurityTab ? securityFooter : settingsFooter)}
    >
      {form.formState.errors.root && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {form.formState.errors.root.message}
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) =>
          swapModalUrl({ name: "settings", tab: value as SettingsTab })
        }
      >
        <TabsList className="w-full mb-4">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="relative gap-1.5">
              <Icon className="size-5" />
              <span className="hidden sm:inline">{label}</span>
              {value !== "sigurnost" && dirty.has(value) && (
                <span
                  aria-label="Nespremljene izmjene"
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
          <TabsContent value="profil" className="animate-in fade-in-0 duration-200">
            <ProfilTab />
          </TabsContent>
          <TabsContent
            value="obavijesti"
            className="animate-in fade-in-0 duration-200"
          >
            <ObavijestiTab />
          </TabsContent>
          <TabsContent
            value="preference"
            className="animate-in fade-in-0 duration-200"
          >
            <PreferenceTab />
          </TabsContent>
        </form>

        {/* Sigurnost's credentials form lives in SigurnostTab (via the security
            context) and is submitted by the shared footer through its formId. */}
        <TabsContent
          value="sigurnost"
          className="animate-in fade-in-0 duration-200"
        >
          <SigurnostTab />
        </TabsContent>
      </Tabs>
    </ModalShell>
  );
}
