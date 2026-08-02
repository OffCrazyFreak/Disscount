"use client";

import InboxNotice from "@/components/custom/common/inbox-notice";
import { useSecurity } from "@/components/custom/settings/security/security-context";

export default function PasswordRecovery() {
  const { recovery } = useSecurity();

  if (!recovery.sentTo) return null;

  // InboxNotice owns the live region now, so every call site is announced.
  return (
    <InboxNotice
      title="Provjeri svoj inbox"
      description="Poslali smo ti poveznicu za promjenu lozinke. Nakon promjene odjavit ćemo te sa svih uređaja."
      email={recovery.sentTo}
    />
  );
}
