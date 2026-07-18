"use client";

import { useState } from "react";
import { LogOut, MonitorSmartphone, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { useSecurityActions } from "@/components/custom/settings/tabs/security/security-actions";

export function AccountActions() {
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
              Odjava s ostalih uređaja
            </span>
          }
          description="Zatvori sve aktivne prijave osim ove trenutne."
          control={
            <Button
              type="button"
              variant="outline"
              icon={LogOut}
              iconPlacement="left"
              disabled={revoking}
              onClick={() => setRevokeOpen(true)}
            >
              Odjavi
            </Button>
          }
        />

        {/* <Separator className="my-2" /> */}

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <TriangleAlert className="size-5" />
              Obriši račun
            </span>
          }
          description="Trajno briše tvoj račun i sve povezane podatke."
          control={
            <Button
              type="button"
              variant="destructive"
              icon={Trash2}
              iconPlacement="left"
              disabled={deleting}
              onClick={() => setDeleteOpen(true)}
            >
              Obriši
            </Button>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={revokeOpen}
        onOpenChange={setRevokeOpen}
        icon={MonitorSmartphone}
        confirmIcon={LogOut}
        title="Odjaviti ostale uređaje?"
        description="Sve aktivne prijave osim ove trenutne bit će zatvorene."
        confirmLabel="Odjavi"
        onConfirm={confirmRevoke}
        isLoading={revoking}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title="Obrisati račun?"
        description="Tvoj račun i svi povezani podaci bit će nepovratno obrisani."
        confirmLabel="Obriši"
        onConfirm={deleteAccount}
        isLoading={deleting}
      />
    </>
  );
}
