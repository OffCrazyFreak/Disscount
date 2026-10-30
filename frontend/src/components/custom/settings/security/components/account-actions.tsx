"use client";

import { useState } from "react";
import { LogOut, MonitorSmartphone, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import SettingRow from "@/components/custom/settings/ui/setting-row";
import { useSecurityActions } from "@/components/custom/settings/security/security-actions";

export default function AccountActions() {
  const t = useTranslations("settings");
  const { revokeOtherSessions, deleteAccount, revoking, deleting } =
    useSecurityActions();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function confirmRevoke() {
    await revokeOtherSessions();
    setRevokeOpen(false);
  }

  return (
    <>
      <div className="space-y-4 pt-6 border-t">
        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <MonitorSmartphone className="size-5" />
              {t("security.actions.revokeLabel")}
            </span>
          }
          description={t("security.actions.revokeDescription")}
          control={
            <Button
              type="button"
              variant="outline"
              icon={LogOut}
              iconPlacement="left"
              disabled={revoking}
              onClick={() => setRevokeOpen(true)}
            >
              {t("security.actions.revokeButton")}
            </Button>
          }
        />

        {/* <Separator className="my-2" /> */}

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
              disabled={deleting}
              onClick={() => setDeleteOpen(true)}
            >
              {t("security.actions.deleteButton")}
            </Button>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={revokeOpen}
        onOpenChange={setRevokeOpen}
        icon={MonitorSmartphone}
        confirmIcon={LogOut}
        title={t("security.actions.revokeDialogTitle")}
        description={t("security.actions.revokeDialogDescription")}
        confirmLabel={t("security.actions.revokeButton")}
        onConfirm={confirmRevoke}
        isLoading={revoking}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title={t("security.actions.deleteDialogTitle")}
        description={t("security.actions.deleteDialogDescription")}
        confirmLabel={t("security.actions.deleteButton")}
        onConfirm={deleteAccount}
        isLoading={deleting}
      />
    </>
  );
}
