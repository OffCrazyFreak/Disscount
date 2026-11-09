"use client";

import { useState } from "react";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import SettingRow from "@/components/custom/settings/ui/setting-row";
import { useSession } from "@/lib/auth/client";
import {
  useAccountSessions,
  useRevokeAccountSession,
} from "@/lib/api/account-sessions/hooks";
import { BACKEND_TOKEN_TTL_MINUTES } from "@/constants/auth";
import { useSecurityActions } from "@/components/custom/settings/security/security-actions";
import ActiveSessionRow from "@/components/custom/settings/security/sessions/active-session-row";

export default function ActiveSessions() {
  const t = useTranslations("settings");
  const { data: current } = useSession();
  const sessions = useAccountSessions(current?.session.id, true);
  const revoke = useRevokeAccountSession();
  const { revokeOtherSessions, revoking } = useSecurityActions();
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);

  const hasOtherSessions = (sessions.data ?? []).some((s) => !s.isCurrent);

  function revokeOne(id: string) {
    revoke.mutate(id, {
      onSuccess: () => toast.success(t("security.sessions.signedOut")),
      onError: () => toast.error(t("security.sessions.signOutFailed")),
    });
  }

  async function confirmRevokeOthers() {
    if (await revokeOtherSessions()) await sessions.refetch();
    setRevokeOthersOpen(false);
  }

  return (
    <SettingsSection
      icon={MonitorSmartphone}
      label={t("security.sessions.label")}
      hint={t("security.sessions.hint")}
    >
      {sessions.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t("security.sessions.loadFailed")}
        </p>
      )}

      {sessions.data && (
        <ul aria-busy={sessions.isFetching} className="divide-y">
          {sessions.data.map((session) => (
            <ActiveSessionRow
              key={session.id}
              session={session}
              isRevoking={revoke.isPending && revoke.variables === session.id}
              onRevoke={revokeOne}
            />
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {t("security.sessions.tokenNote", {
          minutes: BACKEND_TOKEN_TTL_MINUTES,
        })}
      </p>

      <SettingRow
        className="pt-2"
        label={t("security.actions.revokeLabel")}
        description={t("security.actions.revokeDescription")}
        control={
          <Button
            type="button"
            variant="outline"
            icon={LogOut}
            iconPlacement="left"
            disabled={revoking || !hasOtherSessions}
            onClick={() => setRevokeOthersOpen(true)}
          >
            {t("security.actions.revokeButton")}
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={revokeOthersOpen}
        onOpenChange={setRevokeOthersOpen}
        icon={MonitorSmartphone}
        confirmIcon={LogOut}
        title={t("security.actions.revokeDialogTitle")}
        description={t("security.actions.revokeDialogDescription")}
        confirmLabel={t("security.actions.revokeButton")}
        onConfirm={confirmRevokeOthers}
        isLoading={revoking}
      />
    </SettingsSection>
  );
}
