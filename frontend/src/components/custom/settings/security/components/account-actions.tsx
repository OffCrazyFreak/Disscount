"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import SettingRow from "@/components/custom/settings/ui/setting-row";
import { useSecurityActions } from "@/components/custom/settings/security/security-actions";
import { useSecurity } from "@/components/custom/settings/security/security-context";

export default function AccountActions() {
  const t = useTranslations("settings");
  const { deleteAccount } = useSecurityActions();
  const { reauth, status } = useSecurity();

  // Always asks, even inside the 15 minute window: the proof travels with the delete itself.
  function askToDelete() {
    reauth.ask(
      {
        title: t("security.actions.deleteDialogTitle"),
        description: t("security.actions.deleteDialogDescription"),
        confirmLabel: t("security.actions.deleteButton"),
        isDestructive: true,
      },
      deleteAccount,
    );
  }

  return (
    <div className="space-y-4 pt-6 border-t">
      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <TriangleAlert className="size-5" />
            {t("security.actions.deleteLabel")}
          </span>
        }
        description={t("security.actions.deleteDescription")}
        control={
          <Button
            type="button"
            variant="destructive"
            icon={Trash2}
            iconPlacement="left"
            // The proof method depends on the account's sign-in methods.
            disabled={status !== "success"}
            onClick={askToDelete}
          >
            {t("security.actions.deleteButton")}
          </Button>
        }
      />
    </div>
  );
}
